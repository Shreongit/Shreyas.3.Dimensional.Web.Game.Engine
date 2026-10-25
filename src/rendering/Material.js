export class Material {
  constructor({color=[0.2,0.65,0.95],lightDirection=[-0.4,0.8,0.6],ambient=0.22}={}) {
    if(color.length!==3||!color.every(Number.isFinite))throw new TypeError("Material color must be three finite numbers.");
    if(lightDirection.length!==3||!lightDirection.every(Number.isFinite))throw new TypeError("lightDirection must contain three finite numbers.");
    if(!(ambient>=0&&ambient<=1))throw new RangeError("ambient must be in [0, 1].");
    this.color=new Float32Array(color);this.lightDirection=new Float32Array(lightDirection);this.ambient=ambient;
  }
}
