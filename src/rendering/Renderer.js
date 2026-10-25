import { ShaderProgram } from "./ShaderProgram.js";
import { Matrix4 } from "../math/Matrix4.js";

const VERTEX_SHADER = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
out vec3 vNormal;
void main() {
  mat3 normalMatrix = mat3(transpose(inverse(uModel)));
  vNormal = normalize(normalMatrix * aNormal);
  gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec3 vNormal;
uniform vec3 uColor;
uniform vec3 uLightDirection;
uniform float uAmbient;
out vec4 outColor;
void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(-uLightDirection);
  float diffuse = max(dot(normal, lightDir), 0.0);
  float illumination = clamp(uAmbient + (1.0 - uAmbient) * diffuse, 0.0, 1.0);
  outColor = vec4(uColor * illumination, 1.0);
}`;

export class Renderer {
  constructor(canvas, { antialias = true, alpha = false, clearColor = [0.035, 0.055, 0.09, 1] } = {}) {
    if (!canvas || typeof canvas.getContext !== "function") throw new TypeError("Renderer requires a canvas.");
    const gl = canvas.getContext("webgl2", { antialias, alpha, depth: true, stencil: false, premultipliedAlpha: false });
    if (!gl) throw new Error("WebGL 2 is unavailable. Use a browser/device with WebGL 2 enabled.");
    if (clearColor.length !== 4 || !clearColor.every(Number.isFinite)) throw new TypeError("clearColor must have four finite values.");
    this.canvas=canvas;this.gl=gl;this.clearColor=[...clearColor];this.disposed=false;
    this.program=new ShaderProgram(gl,VERTEX_SHADER,FRAGMENT_SHADER);
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);
    this.resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(() => this.resize()) : null;
    this.resizeObserver?.observe(canvas);
    this.resize();
  }
  resize() {
    if (this.disposed) return;
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round((this.canvas.clientWidth || this.canvas.width || 1) * dpr));
    const height = Math.max(1, Math.round((this.canvas.clientHeight || this.canvas.height || 1) * dpr));
    if (this.canvas.width !== width) this.canvas.width = width;
    if (this.canvas.height !== height) this.canvas.height = height;
    this.gl.viewport(0,0,width,height);
    return { width, height, aspect: width / height };
  }
  render(scene, camera) {
    if (this.disposed) throw new Error("Cannot render after dispose().");
    if (!scene || !camera) throw new TypeError("render(scene, camera) requires both arguments.");
    const gl=this.gl;
    const size=this.resize();
    camera.setAspect(size.aspect);camera.updateView();
    gl.clearColor(...this.clearColor);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    this.program.use();
    gl.uniformMatrix4fv(this.program.uniform("uView"),false,camera.viewMatrix.elements);
    gl.uniformMatrix4fv(this.program.uniform("uProjection"),false,camera.projectionMatrix.elements);
    for (const entity of scene.entities || []) {
      if (!entity.active || !entity.mesh || !entity.material || entity.mesh.disposed) continue;
      const model=entity.transform.updateMatrix();
      const material=entity.material;
      gl.uniformMatrix4fv(this.program.uniform("uModel"),false,model.elements);
      gl.uniform3fv(this.program.uniform("uColor"),material.color);
      gl.uniform3fv(this.program.uniform("uLightDirection"),material.lightDirection);
      gl.uniform1f(this.program.uniform("uAmbient"),material.ambient);
      entity.mesh.draw();
    }
  }
  dispose() {
    if (this.disposed) return;
    this.resizeObserver?.disconnect();
    this.program?.dispose();
    this.disposed=true;
  }
  static get shaderSources() { return { vertex: VERTEX_SHADER, fragment: FRAGMENT_SHADER }; }
}
