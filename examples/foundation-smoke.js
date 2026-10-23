import { Engine, Entity, Scene, Vector3 } from "../src/index.js";

const scene = new Scene("foundation-smoke");
const cubePlaceholder = new Entity("future-cube");
cubePlaceholder.transform.position.copy(new Vector3(0, 0, 0));
scene.add(cubePlaceholder);

const engine = new Engine().setScene(scene);
engine.step(1 / 60);
console.log(`S3DWGE foundation ready: ${scene.entities.length} entity, position=${cubePlaceholder.transform.position.toString()}`);
