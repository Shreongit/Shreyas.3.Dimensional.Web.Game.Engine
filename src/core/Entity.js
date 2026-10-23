import { Transform } from "./Transform.js";

let nextEntityId = 1;

export class Entity {
  constructor(name = "Entity") {
    this.id = nextEntityId++;
    this.name = name;
    this.transform = new Transform();
    this.components = [];
    this.scene = null;
    this.active = true;
  }
  addComponent(component) {
    if (!component || typeof component.update !== "function") {
      throw new TypeError("Component must provide an update(deltaSeconds) method.");
    }
    if (component.entity && component.entity !== this) {
      throw new Error("Component is already attached to another entity.");
    }
    if (this.components.includes(component)) return component;
    component.entity = this;
    this.components.push(component);
    component.onAttach?.();
    return component;
  }
  getComponent(Type) { return this.components.find((component) => component instanceof Type) ?? null; }
  removeComponent(component) {
    const index=this.components.indexOf(component);
    if (index < 0) return false;
    this.components.splice(index,1);
    component.onDetach?.();
    component.entity=null;
    return true;
  }
  update(deltaSeconds) {
    if (!this.active) return;
    this.transform.updateMatrix();
    for (const component of [...this.components]) {
      if (component.enabled) component.update(deltaSeconds);
    }
  }
}
