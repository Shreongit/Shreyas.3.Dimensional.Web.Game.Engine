import test from "node:test";
import assert from "node:assert/strict";
import { Camera, Material, Mesh, Renderer, ShaderProgram, Vector3 } from "../src/index.js";

test("Camera validates clipping planes and aspect ratio",()=>{assert.throws(()=>new Camera({near:0}),RangeError);const c=new Camera();c.setAspect(2);assert.equal(c.aspect,2);assert.throws(()=>c.setAspect(0),RangeError);});
test("Material validates color, light and ambient",()=>{assert.throws(()=>new Material({color:[1,2]}),TypeError);assert.throws(()=>new Material({ambient:2}),RangeError);const m=new Material();assert.equal(m.color.length,3);});
test("Mesh rejects malformed geometry before allocating GPU resources",()=>{assert.throws(()=>new Mesh({}, {positions:[0,1],normals:[],indices:[]}),RangeError);assert.throws(()=>new Mesh({}, {positions:[0,0,0],normals:[0,0,1],indices:[0,1,2]}),RangeError);});
test("Renderer reports WebGL 2 unavailable cleanly",()=>{const canvas={getContext:()=>null};assert.throws(()=>new Renderer(canvas),/WebGL 2 is unavailable/);});
test("Renderer exposes valid GLSL ES 3.00 source contracts",()=>{const {vertex,fragment}=Renderer.shaderSources;assert.match(vertex,/^#version 300 es/);assert.match(fragment,/^#version 300 es/);assert.match(vertex,/uProjection/);assert.match(fragment,/uLightDirection/);});
test("ShaderProgram compilation errors are surfaced",()=>{const gl={VERTEX_SHADER:1,FRAGMENT_SHADER:2,createShader:()=>({}),shaderSource(){},compileShader(){},getShaderParameter:()=>false,getShaderInfoLog:()=>"synthetic failure",deleteShader(){}};assert.throws(()=>new ShaderProgram(gl,"bad","bad"),/synthetic failure/);});
test("Mesh rejects non-WebGL context",()=>{assert.throws(()=>new Mesh(null,{}),TypeError);});
