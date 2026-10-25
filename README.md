# S3DWGE — Stage 2: WebGL 2 Rendering

**Version `0.3.0-engine-systems.1`**

Stage 3 extends the WebGL 2 renderer with reusable engine systems: event subscriptions, keyboard/pointer input, asynchronous resource caching, and a source-first glTF 2.0 / GLB 2.0 geometry loader.

## Features
- WebGL 2 renderer with explicit lifecycle and viewport resizing.
- GLSL ES 3.00 shaders.
- Perspective camera with validated clipping planes and view matrix.
- Mesh buffers for positions, normals and indices, encapsulated in a VAO.
- Diffuse material color and directional lighting.
- Scene traversal for entities with `mesh` and `material`.
- `requestAnimationFrame` render loop with stop/dispose handling.
- No third-party runtime dependencies.
- Event emitter with once/off/AbortSignal support.
- Input manager with pressed/down/released keyboard states and pointer deltas.
- Resource manager with typed loaders, in-flight request de-duplication, caching and invalidation.
- glTF/GLB loader for triangle mesh geometry, buffers, accessors, node transforms and generated normals.

## Requirements
- Node.js 18+ for tests and local server.
- Modern browser with WebGL 2 support.

## Run locally
```sh
npm run ci
npm run serve
```
Open `http://127.0.0.1:4173/`.

## Importing
This is a source-first project, not yet published to npm:
```js
import { Renderer, Camera, Mesh, Material } from "./src/index.js";
```

## Conventions
- Right-handed world coordinate system; `+Y` is up.
- Camera looks down local `-Z`.
- Angles are radians.
- Matrices use column-major storage and column-vector multiplication.
- Projection uses WebGL clip-space depth `-1` to `+1`.

## Stage 3 quick examples

```js
import { EventEmitter, InputManager, ResourceManager, GLTFLoader } from "./src/index.js";

const events = new EventEmitter();
const off = events.on("level-loaded", ({ name }) => console.log(name));
events.emit("level-loaded", { name: "intro" });
off();

const input = new InputManager().attach(window);
// In your update loop: if (input.wasPressed("Space")) jump();
// At the end of each frame: input.endFrame();

const resources = new ResourceManager();
const config = await resources.load("./config.json", "json");
const gltf = await new GLTFLoader().load("./assets/scene.gltf");
```

## Architecture
- `src/math/`: vector, quaternion, matrix primitives.
- `src/core/`: transform, entity, scene, engine.
- `src/rendering/`: renderer, camera, mesh, material, shader.
- `src/systems/`: input, events, resource cache.
- `src/assets/`: glTF 2.0 / GLB 2.0 geometry loader.
- `examples/`: browser demo.
- `tests/`: unit and contract tests.

## Stage 3 limitations
The glTF loader currently supports triangle primitives with POSITION, optional NORMAL, and optional indices. Sparse accessors, non-triangle modes, materials/textures, skinning, animations, morph targets, Draco compression and full scene-to-renderer instantiation are not implemented yet. The resource manager does not automatically dispose cached GPU resources. Shadows, post-processing, editor, audio, physics and WebGPU are also future work. WebGL 2 is required for rendering; Node tests cannot replace real browser/GPU verification.

## License
Proprietary — educational viewing only. See [LICENSE](./LICENSE). Public visibility does not grant permission to copy, modify, redistribute, or reuse this code.