import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter, InputManager, ResourceManager } from "../src/index.js";

test("EventEmitter emits arguments and unsubscribe is idempotent", () => {
  const bus=new EventEmitter(); let value=0;
  const off=bus.on("tick",n=>value+=n);
  assert.equal(bus.emit("tick",2),true); off(); off(); bus.emit("tick",5);
  assert.equal(value,2);
});
test("EventEmitter once listeners fire once, including nested emits", () => {
  const bus=new EventEmitter();let calls=0;
  bus.once("ready",()=>{calls++;bus.emit("ready");});
  bus.emit("ready");assert.equal(calls,1);
});
test("EventEmitter supports AbortSignal and removal", () => {
  const bus=new EventEmitter(),controller=new AbortController();let calls=0;
  bus.on("x",()=>calls++,{signal:controller.signal});controller.abort();bus.emit("x");assert.equal(calls,0);
});
test("InputManager tracks down, pressed, released and pointer deltas", () => {
  class Target {
    map=new Map();
    addEventListener(k,v){const s=this.map.get(k)||new Set();s.add(v);this.map.set(k,s);}
    removeEventListener(k,v){this.map.get(k)?.delete(v);}
    fire(k,e={}){for(const fn of this.map.get(k)||[])fn(e);}
  }
  const target=new Target(),input=new InputManager().attach(target);
  target.fire("keydown",{code:"Space"});target.fire("keydown",{code:"Space"});
  assert.equal(input.isDown("Space"),true);assert.equal(input.wasPressed("Space"),true);
  target.fire("pointermove",{clientX:12,clientY:8,movementX:3,movementY:-2});
  assert.deepEqual(input.getPointer(),{x:12,y:8,buttons:0,movementX:3,movementY:-2});
  input.endFrame();assert.equal(input.wasPressed("Space"),false);
  target.fire("keyup",{code:"Space"});assert.equal(input.wasReleased("Space"),true);
  input.detach();assert.equal(target.map.get("keydown").size,0);
});
test("ResourceManager de-duplicates concurrent requests and caches success", async () => {
  let calls=0;
  const manager=new ResourceManager({fetchImpl:async()=>{calls++;await new Promise(r=>setTimeout(r,5));return {ok:true,json:async()=>({ok:true})};}});
  const [a,b]=await Promise.all([manager.load("/config","json"),manager.load("/config","json")]);
  assert.deepEqual(a,{ok:true});assert.equal(a,b);assert.equal(calls,1);
  await manager.load("/config","json");assert.equal(calls,1);
});
test("ResourceManager does not cache failed requests and supports invalidation", async () => {
  let calls=0;
  const manager=new ResourceManager({fetchImpl:async()=>{calls++;return calls===1?{ok:false,status:500}:{ok:true,text:async()=>"ok"};}});
  await assert.rejects(manager.load("/x","text"),/HTTP 500/);
  assert.equal(await manager.load("/x","text"),"ok");assert.equal(manager.has("/x","text"),true);
  manager.invalidate("/x","text");assert.equal(manager.has("/x","text"),false);
});
test("ResourceManager rejects unknown loaders and use after disposal", async () => {
  const manager=new ResourceManager({fetchImpl:async()=>({ok:true})});
  await assert.rejects(manager.load("/x","unknown"),/No resource loader/);
  manager.dispose();await assert.rejects(manager.load("/x"),/disposed/);
});
