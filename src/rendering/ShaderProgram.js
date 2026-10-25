export class ShaderProgram {
  constructor(gl, vertexSource, fragmentSource) {
    this.gl=gl;this.program=null;this.uniforms=new Map();
    const vertex=this._compile(gl.VERTEX_SHADER,vertexSource);
    let fragment;
    try { fragment=this._compile(gl.FRAGMENT_SHADER,fragmentSource); }
    catch(error) { gl.deleteShader(vertex); throw error; }
    const program=gl.createProgram();
    if(!program){gl.deleteShader(vertex);gl.deleteShader(fragment);throw new Error("WebGL could not allocate a shader program.");}
    gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
    const linked=gl.getProgramParameter(program,gl.LINK_STATUS),log=gl.getProgramInfoLog(program);
    gl.detachShader(program,vertex);gl.detachShader(program,fragment);gl.deleteShader(vertex);gl.deleteShader(fragment);
    if(!linked){gl.deleteProgram(program);throw new Error(`Shader program link failed: ${log||"unknown error"}`);}
    this.program=program;
  }
  _compile(type,source) {
    const gl=this.gl,shader=gl.createShader(type);
    if(!shader)throw new Error("WebGL could not allocate a shader.");
    gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const log=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw new Error(`Shader compilation failed: ${log||"unknown error"}`);}
    return shader;
  }
  use() { this.gl.useProgram(this.program);return this; }
  uniform(name) { if(!this.uniforms.has(name))this.uniforms.set(name,this.gl.getUniformLocation(this.program,name));return this.uniforms.get(name); }
  dispose() { if(this.program){this.gl.deleteProgram(this.program);this.program=null;}this.uniforms.clear(); }
}
