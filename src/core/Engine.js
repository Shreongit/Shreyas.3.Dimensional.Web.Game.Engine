export class Engine {
  constructor({ fixedDeltaSeconds = 1 / 60, maxSubSteps = 5, onUpdate = null } = {}) {
    if (!(fixedDeltaSeconds > 0) || !Number.isFinite(fixedDeltaSeconds)) {
      throw new RangeError("fixedDeltaSeconds must be a positive finite number.");
    }
    if (!Number.isInteger(maxSubSteps) || maxSubSteps < 1) throw new RangeError("maxSubSteps must be a positive integer.");
    this.fixedDeltaSeconds=fixedDeltaSeconds;
    this.maxSubSteps=maxSubSteps;
    this.onUpdate=onUpdate;
    this.scene=null;
    this.running=false;
    this.accumulator=0;
    this.lastTimestamp=null;
    this._frameHandle=null;
    this._boundFrame=(timestamp)=>this._frame(timestamp);
  }
  setScene(scene) { this.scene=scene; return this; }
  step(deltaSeconds) {
    if (!(deltaSeconds >= 0) || !Number.isFinite(deltaSeconds)) throw new RangeError("deltaSeconds must be finite and non-negative.");
    this.accumulator += deltaSeconds;
    let steps=0;
    while (this.accumulator >= this.fixedDeltaSeconds && steps < this.maxSubSteps) {
      this.scene?.update(this.fixedDeltaSeconds);
      this.onUpdate?.(this.fixedDeltaSeconds);
      this.accumulator -= this.fixedDeltaSeconds;
      steps++;
    }
    if (steps === this.maxSubSteps && this.accumulator >= this.fixedDeltaSeconds) {
      this.accumulator %= this.fixedDeltaSeconds;
    }
    return steps;
  }
  start() {
    if (this.running) return this;
    if (typeof requestAnimationFrame !== "function") {
      throw new Error("Engine.start() requires requestAnimationFrame; use step() in Node.js tests.");
    }
    this.running=true;
    this.lastTimestamp=null;
    this._frameHandle=requestAnimationFrame(this._boundFrame);
    return this;
  }
  stop() {
    this.running=false;
    if (this._frameHandle !== null && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(this._frameHandle);
    }
    this._frameHandle=null;
    this.lastTimestamp=null;
    return this;
  }
  _frame(timestamp) {
    if (!this.running) return;
    if (this.lastTimestamp !== null) {
      const delta=Math.max(0, (timestamp-this.lastTimestamp)/1000);
      this.step(Math.min(delta, this.fixedDeltaSeconds*this.maxSubSteps*2));
    }
    this.lastTimestamp=timestamp;
    this._frameHandle=requestAnimationFrame(this._boundFrame);
  }
}
