/**
 * Keyboard/pointer input adapter. Call attach() with an EventTarget (usually window).
 * Uses code values for keyboard layout-independent controls.
 */
export class InputManager {
  constructor() {
    this.keys = new Set();
    this.pressed = new Set();
    this.released = new Set();
    this.pointer = { x: 0, y: 0, buttons: 0, movementX: 0, movementY: 0 };
    this.target = null;
    this.attached = false;
    this._handlers = null;
  }
  attach(target = globalThis.window) {
    if (!target?.addEventListener || !target?.removeEventListener) throw new TypeError("InputManager.attach requires an EventTarget.");
    if (this.attached) this.detach();
    this.target = target;
    const keydown = e => {
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
    };
    const keyup = e => { this.keys.delete(e.code); this.released.add(e.code); };
    const blur = () => {
      for (const code of this.keys) this.released.add(code);
      this.keys.clear();
    };
    const pointermove = e => {
      this.pointer.x = e.clientX ?? this.pointer.x;
      this.pointer.y = e.clientY ?? this.pointer.y;
      this.pointer.movementX += e.movementX || 0;
      this.pointer.movementY += e.movementY || 0;
    };
    const pointerdown = e => { this.pointer.buttons = e.buttons ?? this.pointer.buttons; };
    const pointerup = e => { this.pointer.buttons = e.buttons ?? 0; };
    this._handlers = { keydown, keyup, blur, pointermove, pointerdown, pointerup };
    target.addEventListener("keydown", keydown);
    target.addEventListener("keyup", keyup);
    target.addEventListener("blur", blur);
    target.addEventListener("pointermove", pointermove);
    target.addEventListener("pointerdown", pointerdown);
    target.addEventListener("pointerup", pointerup);
    this.attached = true;
    return this;
  }
  detach() {
    if (!this.attached) return this;
    for (const [event, key] of [["keydown","keydown"],["keyup","keyup"],["blur","blur"],["pointermove","pointermove"],["pointerdown","pointerdown"],["pointerup","pointerup"]]) this.target.removeEventListener(event, this._handlers[key]);
    this.target = null; this._handlers = null; this.attached = false;
    this.keys.clear(); this.pressed.clear(); this.released.clear();
    this.pointer.movementX = this.pointer.movementY = 0;
    return this;
  }
  isDown(code) { return this.keys.has(code); }
  wasPressed(code) { return this.pressed.has(code); }
  wasReleased(code) { return this.released.has(code); }
  isPointerDown(button = 0) { return (this.pointer.buttons & (1 << button)) !== 0; }
  getPointer() { return { ...this.pointer }; }
  endFrame() { this.pressed.clear(); this.released.clear(); this.pointer.movementX = 0; this.pointer.movementY = 0; }
  dispose() { this.detach(); }
}
