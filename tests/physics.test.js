import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from '../src/math/Vector3.js';
import { SphereShape, BoxShape, Ray, RigidBody, PhysicsWorld } from '../src/index.js';

test('shape and body constructors reject invalid dimensions and physical values',()=>{
 assert.throws(()=>new SphereShape(0),RangeError);assert.throws(()=>new BoxShape(new Vector3(1,0,1)),RangeError);assert.throws(()=>new RigidBody({shape:new SphereShape(),mass:-1}),RangeError);
});
test('fixed-step world integrates gravity deterministically and syncs entity',()=>{
 const world=new PhysicsWorld({gravity:new Vector3(0,-10,0),fixedDeltaSeconds:.1});const entity={transform:{position:new Vector3(0,2,0)}};const body=world.addBody(new RigidBody({shape:new SphereShape(),position:new Vector3(0,2,0),linearDamping:0}),entity);
 assert.equal(world.step(.05),0);assert.equal(world.step(.05),1);assert.ok(body.velocity.y<0);assert.equal(entity.transform.position.y,body.position.y);
});
test('sphere collision resolves overlap and emits enter/stay/exit events',()=>{
 const world=new PhysicsWorld({gravity:new Vector3(),fixedDeltaSeconds:1/60});const a=world.addBody(new RigidBody({shape:new SphereShape(1),position:new Vector3(0,0,0),mass:0}));const b=world.addBody(new RigidBody({shape:new SphereShape(1),position:new Vector3(1,0,0),linearDamping:0}));let enters=0,stays=0,exits=0;world.events.on('collisionenter',()=>enters++);world.events.on('collisionstay',()=>stays++);world.events.on('collisionexit',()=>exits++);world.step(1/60);assert.equal(enters,1);assert.ok(b.position.x>1);world.step(1/60);assert.equal(stays,1);b.position.x=5;world.step(1/60);assert.equal(exits,1);assert.equal(a.isStatic,true);
});
test('sphere-box collision and trigger events are supported',()=>{
 const world=new PhysicsWorld({gravity:new Vector3()});world.addBody(new RigidBody({shape:new BoxShape(new Vector3(1,1,1)),mass:0}));world.addBody(new RigidBody({shape:new SphereShape(.5),position:new Vector3(1.2,0,0),isTrigger:true}));let n=0;world.events.on('triggerenter',()=>n++);world.step(1/60);assert.equal(n,1);
});
test('raycast returns nearest hit, point, normal and respects max distance',()=>{
 const world=new PhysicsWorld({gravity:new Vector3()});const body=world.addBody(new RigidBody({shape:new BoxShape(new Vector3(1,1,1)),mass:0,position:new Vector3(0,0,-5)}));const ray=new Ray(new Vector3(),new Vector3(0,0,-2));const hit=world.raycast(ray);assert.equal(hit.body,body);assert.ok(Math.abs(hit.distance-4)<1e-9);assert.ok(hit.normal.z>0);assert.equal(world.raycast(ray,{maxDistance:2}),null);
});
test('world validates time and ray inputs, removes bodies and disposes safely',()=>{
 const world=new PhysicsWorld();const body=world.addBody(new RigidBody({shape:new SphereShape()}));assert.throws(()=>world.step(-1),RangeError);assert.throws(()=>world.raycast({}),TypeError);assert.equal(world.removeBody(body),true);assert.equal(world.removeBody(body),false);world.dispose();assert.equal(world.bodies.length,0);
});

test('collision layer and mask filters suppress disallowed pairs',()=>{
 const world=new PhysicsWorld({gravity:new Vector3()});
 world.addBody(new RigidBody({shape:new SphereShape(1),position:new Vector3(),collisionLayer:1,collisionMask:1}));
 const b=world.addBody(new RigidBody({shape:new SphereShape(1),position:new Vector3(1,0,0),collisionLayer:2,collisionMask:2}));
 world.step(1/60);assert.ok(Math.abs(b.position.x-1)<1e-9);
});

test('continuous sphere prevents tunnelling through a thin static box',()=>{
 const world=new PhysicsWorld({gravity:new Vector3(),fixedDeltaSeconds:1/60,maxSubSteps:1});
 world.addBody(new RigidBody({shape:new BoxShape(new Vector3(.05,2,2)),mass:0,position:new Vector3(0,0,0)}));
 const ball=world.addBody(new RigidBody({shape:new SphereShape(.2),position:new Vector3(-3,0,0),velocity:new Vector3(400,0,0),linearDamping:0,continuous:true,restitution:0}));
 world.step(1/60);assert.ok(ball.position.x<0.3,`sphere crossed wall: x=${ball.position.x}`);assert.ok(ball.velocity.x<=0,`expected velocity to be stopped/reflected, got ${ball.velocity.x}`);
});

test('AABB query returns only enabled overlapping bodies and can exclude triggers',()=>{
 const world=new PhysicsWorld({gravity:new Vector3()});
 const a=world.addBody(new RigidBody({shape:new SphereShape(.5),position:new Vector3()}));
 const trigger=world.addBody(new RigidBody({shape:new SphereShape(.5),position:new Vector3(.2,0,0),isTrigger:true}));
 const far=world.addBody(new RigidBody({shape:new SphereShape(.5),position:new Vector3(10,0,0)}));
 const found=world.queryAABB(new Vector3(-1,-1,-1),new Vector3(1,1,1),{includeTriggers:false});
 assert.deepEqual(found,[a]);trigger.enabled=false;assert.deepEqual(world.queryAABB(new Vector3(-1,-1,-1),new Vector3(1,1,1)),[a]);assert.ok(!found.includes(far));
});

test('body validates collision filter bitmasks',()=>{
 assert.throws(()=>new RigidBody({shape:new SphereShape(),collisionLayer:-1}),RangeError);
 assert.throws(()=>new RigidBody({shape:new SphereShape(),collisionMask:1.5}),RangeError);
});
