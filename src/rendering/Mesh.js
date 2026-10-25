export class Mesh {
  constructor(gl,{positions,normals,indices}) {
    if(!gl)throw new TypeError("Mesh requires a WebGL2 context.");
    if(!positions||positions.length===0||positions.length%3!==0)throw new RangeError("positions must contain xyz triples.");
    const vertexCount=positions.length/3;
    if(!normals||normals.length!==positions.length)throw new RangeError("normals must match positions.");
    if(!indices||indices.length===0||indices.length%3!==0)throw new RangeError("indices must contain triangles.");
    for(const i of indices)if(!Number.isInteger(i)||i<0||i>=vertexCount)throw new RangeError(`Index ${i} is outside vertex range.`);
    this.gl=gl;this.indexCount=indices.length;this.disposed=false;
    this.vao=gl.createVertexArray();this.positionBuffer=gl.createBuffer();this.normalBuffer=gl.createBuffer();this.indexBuffer=gl.createBuffer();
    if(!this.vao||!this.positionBuffer||!this.normalBuffer||!this.indexBuffer){this.dispose();throw new Error("WebGL failed to allocate mesh resources.");}
    try {
      gl.bindVertexArray(this.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER,this.positionBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(positions),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER,this.normalBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(normals),gl.STATIC_DRAW);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,0,0);
      const indexData=vertexCount>65535?new Uint32Array(indices):new Uint16Array(indices);
      this.indexType=vertexCount>65535?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indexData,gl.STATIC_DRAW);
    } catch(error) { this.dispose();throw error; }
    finally { gl.bindVertexArray(null);gl.bindBuffer(gl.ARRAY_BUFFER,null); }
  }
  draw() { if(this.disposed)throw new Error("Cannot draw a disposed mesh.");this.gl.bindVertexArray(this.vao);this.gl.drawElements(this.gl.TRIANGLES,this.indexCount,this.indexType,0);this.gl.bindVertexArray(null); }
  dispose() { if(this.disposed)return;const gl=this.gl;if(this.vao)gl.deleteVertexArray(this.vao);if(this.positionBuffer)gl.deleteBuffer(this.positionBuffer);if(this.normalBuffer)gl.deleteBuffer(this.normalBuffer);if(this.indexBuffer)gl.deleteBuffer(this.indexBuffer);this.vao=this.positionBuffer=this.normalBuffer=this.indexBuffer=null;this.disposed=true; }
  static cube(gl) {
    const p=[],n=[],idx=[];
    const faces=[
      {normal:[1,0,0],v:[[1,-1,-1],[1,1,-1],[1,1,1],[1,-1,1]]},
      {normal:[-1,0,0],v:[[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,-1,-1]]},
      {normal:[0,1,0],v:[[-1,1,-1],[-1,1,1],[1,1,1],[1,1,-1]]},
      {normal:[0,-1,0],v:[[-1,-1,1],[-1,-1,-1],[1,-1,-1],[1,-1,1]]},
      {normal:[0,0,1],v:[[1,-1,1],[1,1,1],[-1,1,1],[-1,-1,1]]},
      {normal:[0,0,-1],v:[[-1,-1,-1],[-1,1,-1],[1,1,-1],[1,-1,-1]]}
    ];
    for(const face of faces){const base=p.length/3;for(const v of face.v){p.push(...v);n.push(...face.normal);}idx.push(base,base+1,base+2,base,base+2,base+3);}
    return new Mesh(gl,{positions:p,normals:n,indices:idx});
  }
}
