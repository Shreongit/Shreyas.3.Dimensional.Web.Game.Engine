export class Engine {
  constructor({fixedDeltaSeconds=1/60,maxSubSteps=5,onUpdate=null}={}) {
    if(!(fixedDeltaSeconds>0&&Number.isFinite(fixedDeltaSeconds)))throw new RangeError("fixedDeltaSeconds must be positive and finite.");
    if(!Number.isInteger(maxSubSteps)||maxSubSteps<1)throw new RangeError("maxSubSteps must be a positive integer.");
    this.fixedDeltaSeconds=fixedDeltaSeconds;this.maxSubSteps=maxSubSteps;this.onUpdate=onUpdate;this.scene=null;this.running=false;this.accumulator=0;this.lastTimestamp=null;this.frameHandle=null;this._boundFrame=t=>this._frame(t);
  }
  setScene(scene) { this.scene=scene;return this; }
  step(dt) { if(!(dt>=0&&Number.isFinite(dt)))throw new RangeError("deltaSeconds must be finite and non-negative.");this.accumulator+=dt;let steps=0;while(this.accumulator>=this.fixedDeltaSeconds&&steps<this.maxSubSteps){this.scene?.update(this.fixedDeltaSeconds);this.onUpdate?.(this.fixedDeltaSeconds);this.accumulator-=this.fixedDeltaSeconds;steps++;}if(steps===this.maxSubSteps&&this.accumulator>=this.fixedDeltaSeconds)this.accumulator%=this.fixedDeltaSeconds;return steps; }
  start() { if(this.running)return this;if(typeof requestAnimationFrame!=="function")throw new Error("start() requires requestAnimationFrame; use step() in Node.");this.running=true;this.lastTimestamp=null;this.frameHandle=requestAnimationFrame(this._boundFrame);return this; }
  stop() { this.running=false;if(this.frameHandle!==null&&typeof cancelAnimationFrame==="function")cancelAnimationFrame(this.frameHandle);this.frameHandle=null;this.lastTimestamp=null;return this; }
  _frame(timestamp) { if(!this.running)return;if(this.lastTimestamp!==null)this.step(Math.min(Math.max(0,(timestamp-this.lastTimestamp)/1000),this.fixedDeltaSeconds*this.maxSubSteps*2));this.lastTimestamp=timestamp;this.frameHandle=requestAnimationFrame(this._boundFrame); }
}
