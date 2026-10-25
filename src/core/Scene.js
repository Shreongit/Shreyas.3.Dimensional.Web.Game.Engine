export class Scene {
  constructor(name="Scene") { this.name=name;this.entities=[];this.active=true; }
  add(entity) { if(!entity||typeof entity.update!=="function")throw new TypeError("Scene.add expects an Entity.");if(entity.scene&&entity.scene!==this)throw new Error("Entity already belongs to another scene.");if(!this.entities.includes(entity)){entity.scene=this;this.entities.push(entity);}return entity; }
  remove(entity) { const i=this.entities.indexOf(entity);if(i<0)return false;this.entities.splice(i,1);entity.scene=null;return true; }
  update(dt) { if(this.active)for(const e of [...this.entities])e.update(dt); }
  clear() { for(const e of this.entities)e.scene=null;this.entities.length=0; }
}
