import { Vector3 } from "../math/Vector3.js";

export class RigidBody {
  constructor({shape,mass=1,position=new Vector3(),velocity=new Vector3(),restitution=0.05,friction=0.6,linearDamping=0.01,gravityScale=1,isTrigger=false}={}) {
    if(!shape||!['sphere','box'].includes(shape.type)) throw new TypeError("RigidBody requires a SphereShape or BoxShape.");
    if(!(mass>=0&&Number.isFinite(mass))) throw new RangeError("Mass must be finite and non-negative.");
    for(const [name,value,min,max] of [['restitution',restitution,0,1],['friction',friction,0,1],['linearDamping',linearDamping,0,1]]) if(!(Number.isFinite(value)&&value>=min&&value<=max)) throw new RangeError(`${name} must be between ${min} and ${max}.`);
    if(!Number.isFinite(gravityScale)) throw new RangeError("gravityScale must be finite.");
    this.shape=shape; this.mass=mass; this.inverseMass=mass>0?1/mass:0; this.position=position.clone(); this.velocity=velocity.clone();
    this.force=new Vector3(); this.restitution=restitution; this.friction=friction; this.linearDamping=linearDamping; this.gravityScale=gravityScale; this.isTrigger=Boolean(isTrigger); this.enabled=true; this.entity=null;
  }
  get isStatic(){return this.inverseMass===0;}
  applyForce(force){if(!force||![force.x,force.y,force.z].every(Number.isFinite))throw new TypeError("Force must be a finite Vector3.");if(!this.isStatic)this.force.add(force);return this;}
  applyImpulse(impulse){if(!impulse||![impulse.x,impulse.y,impulse.z].every(Number.isFinite))throw new TypeError("Impulse must be a finite Vector3.");if(!this.isStatic)this.velocity.add(impulse.clone().multiplyScalar(this.inverseMass));return this;}
  syncFromEntity(){if(this.entity)this.position.copy(this.entity.transform.position);return this;}
  syncToEntity(){if(this.entity)this.entity.transform.position.copy(this.position);return this;}
  get scale(){return this.entity?.transform.scale??new Vector3(1,1,1);}
}
