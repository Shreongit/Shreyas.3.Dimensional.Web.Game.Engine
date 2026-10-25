const EPSILON = 1e-12;
export class Vector3 {
  constructor(x=0,y=0,z=0) { this.x=x; this.y=y; this.z=z; }
  set(x,y,z) { this.x=x; this.y=y; this.z=z; return this; }
  copy(v) { return this.set(v.x,v.y,v.z); }
  clone() { return new Vector3(this.x,this.y,this.z); }
  add(v) { this.x+=v.x; this.y+=v.y; this.z+=v.z; return this; }
  sub(v) { this.x-=v.x; this.y-=v.y; this.z-=v.z; return this; }
  multiplyScalar(s) { this.x*=s; this.y*=s; this.z*=s; return this; }
  dot(v) { return this.x*v.x+this.y*v.y+this.z*v.z; }
  cross(v) { const {x,y,z}=this; return this.set(y*v.z-z*v.y,z*v.x-x*v.z,x*v.y-y*v.x); }
  lengthSquared() { return this.dot(this); }
  length() { return Math.sqrt(this.lengthSquared()); }
  normalize() { const n=this.length(); return n>EPSILON ? this.multiplyScalar(1/n) : this.set(0,0,0); }
  normalized() { return this.clone().normalize(); }
  distanceTo(v) { return Math.sqrt(this.distanceToSquared(v)); }
  distanceToSquared(v) { const x=this.x-v.x,y=this.y-v.y,z=this.z-v.z; return x*x+y*y+z*z; }
  equals(v,e=1e-9) { return Math.abs(this.x-v.x)<=e&&Math.abs(this.y-v.y)<=e&&Math.abs(this.z-v.z)<=e; }
  toArray() { return [this.x,this.y,this.z]; }
  static add(a,b) { return a.clone().add(b); }
  static sub(a,b) { return a.clone().sub(b); }
  static cross(a,b) { return a.clone().cross(b); }
}
