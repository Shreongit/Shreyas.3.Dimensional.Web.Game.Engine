export class RenderLoop {
  constructor({renderer,scene,camera,update=null,onError=null}={}) {
    if(!renderer||!scene||!camera)throw new TypeError("RenderLoop requires renderer, scene and camera.");
    this.renderer=renderer;this.scene=scene;this.camera=camera;this.update=update;this.onError=onError;
    this.running=false;this.frameHandle=null;this.lastTime=null;this._bound=t=>this._frame(t);
  }
  start() { if(this.running)return this;if(typeof requestAnimationFrame!=="function")throw new Error("RenderLoop requires requestAnimationFrame.");this.running=true;this.lastTime=null;this.frameHandle=requestAnimationFrame(this._bound);return this; }
  stop() { this.running=false;if(this.frameHandle!==null&&typeof cancelAnimationFrame==="function")cancelAnimationFrame(this.frameHandle);this.frameHandle=null;this.lastTime=null;return this; }
  _frame(timestamp) {
    if(!this.running)return;
    const dt=this.lastTime===null?0:Math.min(Math.max(0,(timestamp-this.lastTime)/1000),.1);
    this.lastTime=timestamp;
    try { this.update?.(dt);this.scene.update(dt);this.renderer.render(this.scene,this.camera); }
    catch(error) { this.stop();if(this.onError)this.onError(error);else { console.error("S3DWGE render loop stopped:",error); } return; }
    this.frameHandle=requestAnimationFrame(this._bound);
  }
  dispose() { this.stop(); }
}
