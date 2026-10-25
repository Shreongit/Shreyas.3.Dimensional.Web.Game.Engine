# S3DWGE — Stage 2: WebGL 2 Rendering

**Version `0.2.0-renderer.1`**

Stage 2 adds a working browser renderer to the S3DWGE foundation: WebGL 2, perspective camera, indexed triangle meshes, shader programs, materials, depth testing, directional lighting, and a rotating-cube demo.

## Features
- WebGL 2 renderer with explicit lifecycle and viewport resizing.
- GLSL ES 3.00 shaders.
- Perspective camera with validated clipping planes and view matrix.
- Mesh buffers for positions, normals and indices, encapsulated in a VAO.
- Diffuse material color and directional lighting.
- Scene traversal for entities with `mesh` and `material`.
- `requestAnimationFrame` render loop with stop/dispose handling.
- No third-party runtime dependencies.

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

## Architecture
- `src/math/`: vector, quaternion, matrix primitives.
- `src/core/`: transform, entity, scene, engine.
- `src/rendering/`: renderer, camera, mesh, material, shader.
- `examples/`: browser demo.
- `tests/`: unit and contract tests.

## Limitations
This milestone is not a finished commercial engine. It does not include glTF/GLB loading, shadows, post-processing, animation, editor, audio, physics, or WebGPU. WebGL 2 is required. Node tests cannot replace real browser/GPU verification.

## License
Proprietary — educational viewing only. See [LICENSE](./LICENSE). Public visibility does not grant permission to copy, modify, redistribute, or reuse this code.