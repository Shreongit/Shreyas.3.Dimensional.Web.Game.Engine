import { Vector3 } from "../math/Vector3.js";
import { Quaternion } from "../math/Quaternion.js";
import { Matrix4 } from "../math/Matrix4.js";
export class Transform {
  constructor() { this.position=new Vector3();this.rotation=new Quaternion();this.scale=new Vector3(1,1,1);this.matrix=new Matrix4(); }
  updateMatrix() { return this.matrix.compose(this.position,this.rotation,this.scale); }
}
