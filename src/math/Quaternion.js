import { Vector3 } from "./Vector3.js";

const EPSILON = 1e-12;

export class Quaternion {
  constructor(x = 0, y = 0, z = 0, w = 1) {
    this.x = x; this.y = y; this.z = z; this.w = w;
  }
  set(x, y, z, w) { this.x = x; this.y = y; this.z = z; this.w = w; return this; }
  copy(q) { return this.set(q.x, q.y, q.z, q.w); }
  clone() { return new Quaternion(this.x, this.y, this.z, this.w); }
  lengthSquared() { return this.x*this.x + this.y*this.y + this.z*this.z + this.w*this.w; }
  normalize() {
    const len = Math.sqrt(this.lengthSquared());
    if (len <= EPSILON) return this.set(0, 0, 0, 1);
    this.x /= len; this.y /= len; this.z /= len; this.w /= len;
    return this;
  }
  conjugate() { this.x = -this.x; this.y = -this.y; this.z = -this.z; return this; }
  invert() {
    const norm = this.lengthSquared();
    if (norm <= EPSILON) return this.set(0, 0, 0, 1);
    this.conjugate();
    this.x /= norm; this.y /= norm; this.z /= norm; this.w /= norm;
    return this;
  }
  multiply(q) {
    const ax=this.x, ay=this.y, az=this.z, aw=this.w;
    const bx=q.x, by=q.y, bz=q.z, bw=q.w;
    return this.set(
      aw*bx + ax*bw + ay*bz - az*by,
      aw*by - ax*bz + ay*bw + az*bx,
      aw*bz + ax*by - ay*bx + az*bw,
      aw*bw - ax*bx - ay*by - az*bz
    );
  }
  setFromAxisAngle(axis, angle) {
    const normalized = axis.normalized();
    const half = angle * 0.5, s = Math.sin(half);
    return this.set(normalized.x*s, normalized.y*s, normalized.z*s, Math.cos(half)).normalize();
  }
  rotateVector(v) {
    const qv = new Vector3(this.x, this.y, this.z);
    const uv = Vector3.cross(qv, v);
    const uuv = Vector3.cross(qv, uv);
    uv.multiplyScalar(2 * this.w);
    uuv.multiplyScalar(2);
    return v.clone().add(uv).add(uuv);
  }
  equals(q, epsilon = 1e-9) {
    return Math.abs(this.x-q.x)<=epsilon && Math.abs(this.y-q.y)<=epsilon &&
      Math.abs(this.z-q.z)<=epsilon && Math.abs(this.w-q.w)<=epsilon;
  }
  static identity() { return new Quaternion(); }
}
