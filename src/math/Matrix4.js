import { Vector3 } from "./Vector3.js";
import { Quaternion } from "./Quaternion.js";

export class Matrix4 {
  constructor(elements) {
    this.elements = elements ? new Float64Array(elements) : new Float64Array(16);
    if (!elements) this.identity();
    if (this.elements.length !== 16) throw new RangeError("Matrix4 requires 16 elements.");
  }
  identity() {
    this.elements.fill(0);
    this.elements[0]=1; this.elements[5]=1; this.elements[10]=1; this.elements[15]=1;
    return this;
  }
  copy(m) { this.elements.set(m.elements); return this; }
  clone() { return new Matrix4(this.elements); }
  multiply(m) { return Matrix4.multiply(this, m, this); }
  premultiply(m) { return Matrix4.multiply(m, this, this); }
  toArray() { return Array.from(this.elements); }
  static multiply(a, b, out = new Matrix4()) {
    const ae=a.elements, be=b.elements, te=out.elements;
    const result = new Float64Array(16);
    for (let col=0; col<4; col++) {
      for (let row=0; row<4; row++) {
        result[col*4+row] =
          ae[0*4+row]*be[col*4+0] +
          ae[1*4+row]*be[col*4+1] +
          ae[2*4+row]*be[col*4+2] +
          ae[3*4+row]*be[col*4+3];
      }
    }
    te.set(result);
    return out;
  }
  makeTranslation(x, y, z) {
    this.identity();
    this.elements[12]=x; this.elements[13]=y; this.elements[14]=z;
    return this;
  }
  makeScale(x, y, z) {
    this.identity();
    this.elements[0]=x; this.elements[5]=y; this.elements[10]=z;
    return this;
  }
  makeRotationFromQuaternion(q) {
    const x=q.x, y=q.y, z=q.z, w=q.w;
    const x2=x+x, y2=y+y, z2=z+z;
    const xx=x*x2, xy=x*y2, xz=x*z2;
    const yy=y*y2, yz=y*z2, zz=z*z2;
    const wx=w*x2, wy=w*y2, wz=w*z2;
    const e=this.elements;
    e[0]=1-(yy+zz); e[1]=xy+wz; e[2]=xz-wy; e[3]=0;
    e[4]=xy-wz; e[5]=1-(xx+zz); e[6]=yz+wx; e[7]=0;
    e[8]=xz+wy; e[9]=yz-wx; e[10]=1-(xx+yy); e[11]=0;
    e[12]=0; e[13]=0; e[14]=0; e[15]=1;
    return this;
  }
  compose(position, rotation, scale) {
    this.makeRotationFromQuaternion(rotation);
    const e=this.elements;
    const sx=scale.x, sy=scale.y, sz=scale.z;
    e[0]*=sx; e[1]*=sx; e[2]*=sx;
    e[4]*=sy; e[5]*=sy; e[6]*=sy;
    e[8]*=sz; e[9]*=sz; e[10]*=sz;
    e[12]=position.x; e[13]=position.y; e[14]=position.z;
    return this;
  }
  makePerspective(fovYRadians, aspect, near, far) {
    if (!(fovYRadians > 0 && fovYRadians < Math.PI)) throw new RangeError("FOV must be between 0 and PI radians.");
    if (!(aspect > 0)) throw new RangeError("Aspect ratio must be positive.");
    if (!(near > 0) || !(far > near)) throw new RangeError("Require 0 < near < far.");
    const f=1/Math.tan(fovYRadians/2), nf=1/(near-far), e=this.elements;
    e.fill(0);
    e[0]=f/aspect; e[5]=f;
    e[10]=(far+near)*nf; e[11]=-1;
    e[14]=(2*far*near)*nf;
    return this;
  }
  makeLookAt(eye, target, up = new Vector3(0,1,0)) {
    const z=Vector3.sub(eye,target).normalize();
    if (z.lengthSquared() === 0) throw new RangeError("Eye and target must differ.");
    let x=Vector3.cross(up,z).normalize();
    if (x.lengthSquared() === 0) {
      const fallback = Math.abs(z.y) < 0.999 ? new Vector3(0,1,0) : new Vector3(1,0,0);
      x=Vector3.cross(fallback,z).normalize();
    }
    const y=Vector3.cross(z,x).normalize();
    const e=this.elements;
    e[0]=x.x; e[1]=y.x; e[2]=z.x; e[3]=0;
    e[4]=x.y; e[5]=y.y; e[6]=z.y; e[7]=0;
    e[8]=x.z; e[9]=y.z; e[10]=z.z; e[11]=0;
    e[12]=-x.dot(eye); e[13]=-y.dot(eye); e[14]=-z.dot(eye); e[15]=1;
    return this;
  }
}
