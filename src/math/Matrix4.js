import { Vector3 } from "./Vector3.js";
export class Matrix4 {
  constructor(elements) { this.elements=elements?new Float32Array(elements):new Float32Array(16); if(this.elements.length!==16)throw new RangeError("Matrix4 requires 16 elements."); if(!elements)this.identity(); }
  identity() { this.elements.fill(0); this.elements[0]=this.elements[5]=this.elements[10]=this.elements[15]=1; return this; }
  copy(m) { this.elements.set(m.elements); return this; }
  clone() { return new Matrix4(this.elements); }
  multiply(m) { return Matrix4.multiply(this,m,this); }
  static multiply(a,b,out=new Matrix4()) {
    const ae=a.elements,be=b.elements,r=new Float32Array(16),te=out.elements;
    for(let c=0;c<4;c++) for(let row=0;row<4;row++) r[c*4+row]=ae[row]*be[c*4]+ae[4+row]*be[c*4+1]+ae[8+row]*be[c*4+2]+ae[12+row]*be[c*4+3];
    te.set(r); return out;
  }
  makeTranslation(x,y,z) { this.identity(); this.elements[12]=x; this.elements[13]=y; this.elements[14]=z; return this; }
  makeRotationFromQuaternion(q) {
    const {x,y,z,w}=q,x2=x+x,y2=y+y,z2=z+z,xx=x*x2,xy=x*y2,xz=x*z2,yy=y*y2,yz=y*z2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2,e=this.elements;
    e[0]=1-yy-zz;e[1]=xy+wz;e[2]=xz-wy;e[3]=0;e[4]=xy-wz;e[5]=1-xx-zz;e[6]=yz+wx;e[7]=0;e[8]=xz+wy;e[9]=yz-wx;e[10]=1-xx-yy;e[11]=0;e[12]=e[13]=e[14]=0;e[15]=1;return this;
  }
  compose(position,rotation,scale) { this.makeRotationFromQuaternion(rotation); const e=this.elements; for(const i of [0,1,2])e[i]*=scale.x; for(const i of [4,5,6])e[i]*=scale.y; for(const i of [8,9,10])e[i]*=scale.z; e[12]=position.x;e[13]=position.y;e[14]=position.z;return this; }
  makePerspective(fov,aspect,near,far) {
    if(!(fov>0&&fov<Math.PI))throw new RangeError("FOV must be between 0 and PI radians.");
    if(!(aspect>0&&Number.isFinite(aspect)))throw new RangeError("Aspect ratio must be positive and finite.");
    if(!(near>0&&far>near&&Number.isFinite(near)&&Number.isFinite(far)))throw new RangeError("Require finite 0 < near < far.");
    const f=1/Math.tan(fov/2),nf=1/(near-far),e=this.elements;e.fill(0);e[0]=f/aspect;e[5]=f;e[10]=(far+near)*nf;e[11]=-1;e[14]=2*far*near*nf;return this;
  }
  makeLookAt(eye,target,up=new Vector3(0,1,0)) {
    const z=Vector3.sub(eye,target).normalize(); if(z.lengthSquared()===0)throw new RangeError("Eye and target must differ.");
    let x=Vector3.cross(up,z).normalize(); if(x.lengthSquared()===0)x=Vector3.cross(Math.abs(z.y)<.999?new Vector3(0,1,0):new Vector3(1,0,0),z).normalize();
    const y=Vector3.cross(z,x).normalize(),e=this.elements;
    e[0]=x.x;e[1]=y.x;e[2]=z.x;e[3]=0;e[4]=x.y;e[5]=y.y;e[6]=z.y;e[7]=0;e[8]=x.z;e[9]=y.z;e[10]=z.z;e[11]=0;e[12]=-x.dot(eye);e[13]=-y.dot(eye);e[14]=-z.dot(eye);e[15]=1;return this;
  }
}
