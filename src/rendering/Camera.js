import { Vector3 } from "../math/Vector3.js";
import { Matrix4 } from "../math/Matrix4.js";
export class Camera {
  constructor({position=new Vector3(0,0,5),target=new Vector3(0,0,0),up=new Vector3(0,1,0),fovY=Math.PI/3,near=.1,far=1000}={}) {
    if(!(near>0&&far>near))throw new RangeError("Camera requires 0 < near < far.");
    this.position=position.clone();this.target=target.clone();this.up=up.clone();this.fovY=fovY;this.near=near;this.far=far;this.viewMatrix=new Matrix4();this.projectionMatrix=new Matrix4();this.aspect=1;this.updateView();
  }
  updateView() { this.viewMatrix.makeLookAt(this.position,this.target,this.up);return this.viewMatrix; }
  setAspect(aspect) { if(!(aspect>0&&Number.isFinite(aspect)))throw new RangeError("Aspect ratio must be positive and finite.");this.aspect=aspect;this.projectionMatrix.makePerspective(this.fovY,aspect,this.near,this.far);return this.projectionMatrix; }
  updateProjection() { return this.setAspect(this.aspect); }
}
