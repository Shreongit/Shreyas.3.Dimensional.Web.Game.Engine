const EPSILON = 1e-12;

export class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  copy(v) { return this.set(v.x, v.y, v.z); }
  clone() { return new Vector3(this.x, this.y, this.z); }
  add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
  divideScalar(s) {
    if (s === 0) throw new RangeError("Cannot divide Vector3 by zero.");
    return this.multiplyScalar(1 / s);
  }
  dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
  cross(v) {
    const x = this.x, y = this.y, z = this.z;
    this.x = y * v.z - z * v.y;
    this.y = z * v.x - x * v.z;
    this.z = x * v.y - y * v.x;
    return this;
  }
  lengthSquared() { return this.dot(this); }
  length() { return Math.sqrt(this.lengthSquared()); }
  normalize() {
    const len = this.length();
    if (len > EPSILON) this.multiplyScalar(1 / len);
    else this.set(0, 0, 0);
    return this;
  }
  normalized() { return this.clone().normalize(); }
  distanceTo(v) { return Math.sqrt(this.distanceToSquared(v)); }
  distanceToSquared(v) {
    const x = this.x - v.x, y = this.y - v.y, z = this.z - v.z;
    return x * x + y * y + z * z;
  }
  equals(v, epsilon = 1e-9) {
    return Math.abs(this.x - v.x) <= epsilon &&
      Math.abs(this.y - v.y) <= epsilon &&
      Math.abs(this.z - v.z) <= epsilon;
  }
  isFinite() { return Number.isFinite(this.x) && Number.isFinite(this.y) && Number.isFinite(this.z); }
  toArray() { return [this.x, this.y, this.z]; }
  toString() { return `Vector3(${this.x}, ${this.y}, ${this.z})`; }
  static add(a, b) { return a.clone().add(b); }
  static sub(a, b) { return a.clone().sub(b); }
  static cross(a, b) { return a.clone().cross(b); }
  static dot(a, b) { return a.dot(b); }
}
