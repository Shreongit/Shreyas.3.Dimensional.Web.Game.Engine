import test from "node:test";
import assert from "node:assert/strict";
import { Component, Entity, Scene, Engine, Vector3 } from "../src/index.js";

class Counter extends Component {
  constructor() { super(); this.total=0; }
  update(dt) { this.total += dt; }
}
test("Entity attaches, updates, and removes components", () => {
  const entity=new Entity("player"), counter=new Counter();
  entity.addComponent(counter);
  entity.update(.25);
  assert.equal(counter.total,.25);
  assert.equal(counter.entity,entity);
  assert.equal(entity.removeComponent(counter),true);
  assert.equal(counter.entity,null);
  assert.equal(entity.removeComponent(counter),false);
});
test("Scene owns entities and updates them", () => {
  const scene=new Scene("test"), entity=new Entity(), counter=entity.addComponent(new Counter());
  scene.add(entity); scene.update(.5);
  assert.equal(counter.total,.5);
  assert.equal(entity.scene,scene);
  assert.equal(scene.remove(entity),true);
  assert.equal(entity.scene,null);
});
test("An entity cannot belong to two scenes", () => {
  const entity=new Entity(), a=new Scene("a"), b=new Scene("b");
  a.add(entity);
  assert.throws(()=>b.add(entity),Error);
});
test("Engine fixed-step loop accumulates and caps work", () => {
  let total=0;
  const engine=new Engine({fixedDeltaSeconds:.1,maxSubSteps:3,onUpdate:dt=>total+=dt});
  assert.equal(engine.step(.25),2);
  assert.ok(Math.abs(total-.2)<1e-10);
  assert.equal(engine.step(1),3);
  assert.ok(total <= .5000001);
  assert.throws(()=>engine.step(-1),RangeError);
});
test("Transform composes position and scale into a matrix", () => {
  const entity=new Entity();
  entity.transform.position.copy(new Vector3(2,3,4));
  entity.transform.scale.set(2,3,4);
  const m=entity.transform.updateMatrix().elements;
  assert.equal(m[0],2); assert.equal(m[5],3); assert.equal(m[10],4);
  assert.equal(m[12],2); assert.equal(m[13],3); assert.equal(m[14],4);
});
test("Disabled entity and disabled component do not update", () => {
  const entity=new Entity(), counter=entity.addComponent(new Counter());
  counter.enabled=false; entity.update(1);
  entity.active=false; counter.enabled=true; entity.update(1);
  assert.equal(counter.total,0);
});
