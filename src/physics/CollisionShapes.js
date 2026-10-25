import { Vector3 } from "../math/Vector3.js";

export class SphereShape {
  constructor(radius=0.5, center=new Vector3()) {
    if (!(radius > 0 && Number.isFinite(radius))) throw new RangeError("Sphere radius must be positive and finite.");
    this.type = "sphere"; this.radius = radius; this.center = center.clone();
  }
  worldCenter(body) { return body.position.clone().add(this.center); }
}

export class BoxShape {
  constructor(halfExtents=new Vector3(0.5,0.5,0.5), center=new Vector3()) {
    if (![halfExtents.x,halfExtents.y,halfExtents.z].every(v=>Number.isFinite(v)&&v>0)) throw new RangeError("Box half-extents must be positive and finite.");
    this.type = "box"; this.halfExtents = halfExtents.clone(); this.center = center.clone();
  }
  bounds(body) {
    const c=body.position.clone().add(this.center), s=body.scale;
    const h=new Vector3(this.halfExtents.x*Math.abs(s.x),this.halfExtents.y*Math.abs(s.y),this.halfExtents.z*Math.abs(s.z));
    return {min:c.clone().sub(h),max:c.clone().add(h),center:c,halfExtents:h};
  }
}

export class Ray {
  constructor(origin=new Vector3(), direction=new Vector3(0,0,-1)) {
    if(direction.lengthSquared()===0) throw new RangeError("Ray direction cannot be zero.");
    this.origin=origin.clone(); this.direction=direction.clone().normalize();
  }
  at(distance) { return this.origin.clone().add(this.direction.clone().multiplyScalar(distance)); }
}
