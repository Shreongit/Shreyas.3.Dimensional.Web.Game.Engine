import { Vector3 } from "./Vector3.js";
const EPSILON=1e-12;
export class Quaternion {
  constructor(x=0,y=0,z=0,w=1) { this.x=x; this.y=y; this.z=z; this.w=w; }
  set(x,y,z,w) { this.x=x; this.y=y; this.z=z; this.w=w; return this; }
  copy(q) { return this.set(q.x,q.y,q.z,q.w); }
  clone() { return new Quaternion(this.x,this.y,this.z,this.w); }
  lengthSquared() { return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w; }
  normalize() { const n=Math.sqrt(this.lengthSquared()); if(n<=EPSILON)return this.set(0,0,0,1); return this.set(this.x/n,this.y/n,this.z/n,this.w/n); }
  conjugate() { this.x=-this.x; this.y=-this.y; this.z=-this.z; return this; }
  invert() { const n=this.lengthSquared(); if(n<=EPSILON)return this.set(0,0,0,1); this.conjugate(); this.x/=n; this.y/=n; this.z/=n; this.w/=n; return this; }
  multiply(q) {
    const {x:aX,y:aY,z:aZ,w:aW}=this,{x:bX,y:bY,z:bZ,w:bW}=q;
    return this.set(aW*bX+aX*bW+aY*bZ-aZ*bY,aW*bY-aX*bZ+aY*bW+aZ*bX,aW*bZ+aX*bY-aY*bX+aZ*bW,aW*bW-aX*bX-aY*bY-aZ*bZ);
  }
  setFromAxisAngle(axis,angle) { const a=axis.normalized(),h=angle/2,s=Math.sin(h); return this.set(a.x*s,a.y*s,a.z*s,Math.cos(h)).normalize(); }
  rotateVector(v) { const qv=new Vector3(this.x,this.y,this.z),uv=Vector3.cross(qv,v),uuv=Vector3.cross(qv,uv); return v.clone().add(uv.multiplyScalar(2*this.w)).add(uuv.multiplyScalar(2)); }
}
