import { Transform } from "./Transform.js";
let nextEntityId=1;
export class Entity {
  constructor(name="Entity") { this.id=nextEntityId++;this.name=name;this.transform=new Transform();this.components=[];this.scene=null;this.active=true;this.mesh=null;this.material=null; }
  addComponent(component) {
    if(!component||typeof component.update!=="function")throw new TypeError("Component must provide update(deltaSeconds).");
    if(component.entity&&component.entity!==this)throw new Error("Component is already attached to another entity.");
    if(this.components.includes(component))return component;
    component.entity=this;this.components.push(component);component.onAttach?.();return component;
  }
  getComponent(Type) { return this.components.find(c=>c instanceof Type)??null; }
  removeComponent(component) { const i=this.components.indexOf(component);if(i<0)return false;this.components.splice(i,1);component.onDetach?.();component.entity=null;return true; }
  update(dt) { if(!this.active)return;this.transform.updateMatrix();for(const c of [...this.components])if(c.enabled)c.update(dt); }
}
