import test from "node:test";
import assert from "node:assert/strict";
import { Vector3, Quaternion, Matrix4 } from "../src/index.js";

const close = (actual, expected, epsilon=1e-8) => assert.ok(Math.abs(actual-expected)<=epsilon, `${actual} not close to ${expected}`);

test("Vector3 arithmetic, dot, and cross products", () => {
  const a=new Vector3(1,2,3), b=new Vector3(4,-1,2);
  assert.deepEqual(Vector3.add(a,b).toArray(), [5,1,5]);
  assert.equal(a.dot(b), 8);
  assert.deepEqual(Vector3.cross(a,b).toArray(), [7,10,-9]);
});
test("Vector3 normalization handles zero and rejects division by zero", () => {
  assert.ok(new Vector3(0,0,0).normalize().equals(new Vector3()));
  assert.ok(new Vector3(3,0,4).normalized().equals(new Vector3(.6,0,.8)));
  assert.throws(() => new Vector3(1,2,3).divideScalar(0), RangeError);
});
test("Quaternion rotates a vector around Y axis", () => {
  const q=new Quaternion().setFromAxisAngle(new Vector3(0,1,0), Math.PI/2);
  const result=q.rotateVector(new Vector3(0,0,1));
  close(result.x,1); close(result.y,0); close(result.z,0);
});
test("Quaternion multiplication and inverse restore vector", () => {
  const q=new Quaternion().setFromAxisAngle(new Vector3(1,2,3), 0.7);
  const v=new Vector3(2,-1,4);
  const restored=q.clone().invert().rotateVector(q.rotateVector(v));
  assert.ok(restored.equals(v,1e-8));
});
test("Matrix4 identity and multiplication", () => {
  const m=new Matrix4().makeTranslation(2,3,4);
  const out=Matrix4.multiply(m,new Matrix4());
  assert.deepEqual(out.toArray(), m.toArray());
  assert.equal(out.elements[12],2);
});
test("Matrix4 perspective validates clipping planes", () => {
  const m=new Matrix4().makePerspective(Math.PI/3, 16/9, .1, 100);
  assert.ok(m.elements.every(Number.isFinite));
  assert.throws(()=>new Matrix4().makePerspective(Math.PI,1,.1,10), RangeError);
  assert.throws(()=>new Matrix4().makePerspective(1,1,10,1), RangeError);
});
test("Matrix4 look-at builds finite view matrix", () => {
  const m=new Matrix4().makeLookAt(new Vector3(0,0,5),new Vector3(0,0,0));
  assert.ok(m.elements.every(Number.isFinite));
  close(m.elements[14],-5);
  assert.throws(()=>new Matrix4().makeLookAt(new Vector3(),new Vector3()),RangeError);
});
