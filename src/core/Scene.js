export class Scene {
  constructor(name = "Scene") {
    this.name = name;
    this.entities = [];
    this.active = true;
  }
  add(entity) {
    if (!entity || typeof entity.update !== "function") throw new TypeError("Scene.add expects an Entity.");
    if (entity.scene && entity.scene !== this) throw new Error("Entity already belongs to another scene.");
    if (this.entities.includes(entity)) return entity;
    entity.scene=this;
    this.entities.push(entity);
    return entity;
  }
  remove(entity) {
    const index=this.entities.indexOf(entity);
    if (index < 0) return false;
    this.entities.splice(index,1);
    entity.scene=null;
    return true;
  }
  update(deltaSeconds) {
    if (!this.active) return;
    for (const entity of [...this.entities]) entity.update(deltaSeconds);
  }
  clear() {
    for (const entity of this.entities) entity.scene=null;
    this.entities.length=0;
  }
}
