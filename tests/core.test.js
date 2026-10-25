import test from "node:test";
import assert from "node:assert/strict";
import { Component, Entity, Scene, Engine, Vector3 } from "../src/index.js";
class Counter extends Component { constructor(){super();this.total=0;} update(dt){this.total+=dt;} }
test("components attach, update and detach",()=>{const e=new Entity("player"),c=new Counter();e.addComponent(c);e.update(.25);assert.equal(c.total,.25);assert.equal(e.removeComponent(c),true);assert.equal(c.entity,null);});
test("scene owns entities and updates components",()=>{const s=new Scene(),e=new Entity(),c=e.addComponent(new Counter());s.add(e);s.update(.5);assert.equal(c.total,.5);assert.equal(e.scene,s);});
test("entity cannot be attached to two scenes",()=>{const e=new Entity(),a=new Scene(),b=new Scene();a.add(e);assert.throws(()=>b.add(e),Error);});
test("fixed-step engine accumulates and caps work",()=>{let total=0;const engine=new Engine({fixedDeltaSeconds:.1,maxSubSteps:3,onUpdate:dt=>total+=dt});assert.equal(engine.step(.25),2);assert.equal(engine.step(1),3);assert.ok(total<=.500001);assert.throws(()=>engine.step(-1),RangeError);});
test("transform composes scale and position",()=>{const e=new Entity();e.transform.position.copy(new Vector3(2,3,4));e.transform.scale.set(2,3,4);const m=e.transform.updateMatrix().elements;assert.equal(m[0],2);assert.equal(m[5],3);assert.equal(m[10],4);assert.equal(m[12],2);});
