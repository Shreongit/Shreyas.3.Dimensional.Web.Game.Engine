import test from "node:test";
import assert from "node:assert/strict";
import { GLTFLoader } from "../src/index.js";

function makeGltf() {
  const values=new Float32Array([0,0,0, 1,0,0, 0,1,0]);
  const bytes=new Uint8Array(values.buffer);
  let binary="";for(const byte of bytes)binary+=String.fromCharCode(byte);
  const uri="data:application/octet-stream;base64,"+(typeof btoa==="function"?btoa(binary):Buffer.from(bytes).toString("base64"));
  return {asset:{version:"2.0"},buffers:[{uri,byteLength:bytes.byteLength}],bufferViews:[{buffer:0,byteOffset:0,byteLength:bytes.byteLength}],accessors:[{bufferView:0,componentType:5126,count:3,type:"VEC3"}],meshes:[{primitives:[{attributes:{POSITION:0}}]}],nodes:[{name:"Triangle",mesh:0}],scenes:[{nodes:[0]}]};
}
test("GLTFLoader parses triangle geometry and generates normals", async () => {
  const json=makeGltf();
  const loader=new GLTFLoader({fetchImpl:async(url)=>({ok:true,arrayBuffer:async()=>new TextEncoder().encode(JSON.stringify(json)).buffer})});
  const result=await loader.load("https://example.test/triangle.gltf");
  assert.equal(result.meshes.length,1);
  const primitive=result.meshes[0].primitives[0];
  assert.equal(primitive.positions.length,9);assert.equal(primitive.indices.length,3);
  assert.deepEqual(Array.from(primitive.normals),[0,0,1,0,0,1,0,0,1]);
  assert.equal(result.nodes[0].name,"Triangle");
});
test("GLTFLoader rejects unsupported document versions and HTTP errors", async () => {
  const bad=new GLTFLoader({fetchImpl:async()=>({ok:true,arrayBuffer:async()=>new TextEncoder().encode(JSON.stringify({asset:{version:"1.0"}})).buffer})});
  await assert.rejects(bad.load("https://example.test/bad.gltf"),/glTF 2.0/);
  const failed=new GLTFLoader({fetchImpl:async()=>({ok:false,status:404})});
  await assert.rejects(failed.load("https://example.test/missing.gltf"),/HTTP 404/);
});
test("GLTFLoader validates accessor buffer bounds", async () => {
  const json=makeGltf();json.bufferViews[0].byteLength=4;
  const loader=new GLTFLoader({fetchImpl:async()=>({ok:true,arrayBuffer:async()=>new TextEncoder().encode(JSON.stringify(json)).buffer})});
  await assert.rejects(loader.load("https://example.test/bounds.gltf"),/buffer bounds/);
});
