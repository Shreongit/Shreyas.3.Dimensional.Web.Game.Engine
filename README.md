<div align="center">

# S3DWGE
### Shreyas 3D Web Game Engine

**A source-first JavaScript engine foundation for building interactive 3D games that run in modern web browsers.**

![JavaScript](https://img.shields.io/badge/JavaScript-ES%20Modules-f7df1e?logo=javascript&logoColor=111111)
![Graphics](https://img.shields.io/badge/Graphics-WebGL%202-6b5b95)
![Physics](https://img.shields.io/badge/Physics-Experimental-orange)
![Node](https://img.shields.io/badge/Node.js-18%2B-43853d?logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/License-Proprietary-red)

**Current milestone: `0.5.0-advanced-physics.1` — Stage 5**

[Overview](#what-is-s3dwge) · [Features](#what-is-included) · [Quick start](#quick-start) · [Examples](#physics-example) · [Architecture](#project-structure) · [Testing](#testing) · [Roadmap](#roadmap) · [License](#license)

</div>

---

## What is S3DWGE?

**S3DWGE (Shreyas 3D Web Game Engine)** is an independent, modular 3D game-engine project written in JavaScript using ES modules. Its goal is to provide reusable building blocks for browser games: 3D math, entities and transforms, a WebGL 2 renderer, input and resource systems, geometry loading, and an evolving physics subsystem.

The project is being developed in stages. The current package is an **early engineering milestone**, not a finished general-purpose engine or a stable `1.0.0` release. Its APIs may change as systems are integrated and tested. It is intended as a foundation to learn from, extend, and eventually use to build complete browser games.

### Design goals

- **Browser-native:** use JavaScript modules and WebGL 2 without a third-party runtime engine dependency.
- **Modular:** keep math, core lifecycle, rendering, assets, input, and physics in separate source areas.
- **Inspectable:** keep the engine source available inside the project for learning and debugging, subject to the proprietary license below.
- **Testable:** provide Node.js automated tests for deterministic contracts and regression cases.
- **Incremental:** document implemented capabilities and limitations instead of claiming unfinished features.

## What is included

### Core and math

- `Vector3`, `Quaternion`, and `Matrix4` primitives.
- `Transform` with position, rotation, scale, and matrix composition.
- `Entity`, `Component`, `Scene`, and engine lifecycle foundations.

### Rendering

- WebGL 2 renderer using GLSL ES 3.00 shaders.
- Perspective camera, depth testing, viewport resizing, and directional diffuse lighting.
- Indexed meshes with position and normal attributes.
- Basic material color and a request-animation-frame render loop.
- A browser rendering demo with a rotating cube.

### Engine systems and assets

- Event subscriptions, one-shot listeners, unsubscription, and `AbortSignal` support.
- Keyboard and pointer input state tracking.
- Resource loading for text, JSON, array buffers, and blobs, with caching and in-flight request de-duplication.
- A source-first glTF 2.0 / GLB 2.0 geometry loader for supported triangle primitives.

### Physics — Stage 5

- Fixed-step simulation with configurable gravity, step size, and maximum substeps.
- Dynamic and static rigid bodies; force and impulse application; linear damping; gravity scale.
- Sphere and **axis-aligned** box shapes, with sphere–sphere, sphere–box, and box–box collision handling.
- Restitution, friction, positional correction, trigger contacts, and enter/stay/exit events.
- Sweep-and-prune broad-phase candidate generation.
- Nearest-hit raycasting and AABB overlap queries.
- Collision layers and masks for filtering body pairs.
- Optional conservative continuous collision handling for a moving sphere against static axis-aligned boxes, designed to reduce tunnelling through thin walls.

> **Physics scope matters:** this is a lightweight in-development solver. Box rotations are not included in collision bounds. Continuous collision handling is limited to the documented sphere-versus-static-box case; it is not general-purpose CCD. There is no angular rigid-body dynamics, inertia tensor, joint solver, triangle-mesh collider, or sleeping system yet.

## Quick start

### Requirements

- Node.js 18 or newer for the included test and local-server scripts.
- A modern browser with WebGL 2 support to run the rendering demo.
- No third-party runtime package installation is required for the current test suite.

### Run the checks

Extract the ZIP, open a terminal in the project directory, then run:

```sh
npm run ci
```

This runs the JavaScript syntax check and Node.js test suite.

### Start the browser demo

```sh
npm run serve
```

Then open <http://127.0.0.1:4173/>. The development server serves the included example files. If the port is already in use, stop the process using it before starting the server again.

### Import source modules

This is currently a **source-first project**, not a published npm package and not a bundled/minified distribution. Import modules directly from the project:

```js
import {
  Vector3,
  PhysicsWorld,
  RigidBody,
  SphereShape,
  BoxShape,
  Ray,
} from "./src/index.js";
```

Use a local HTTP server for browser ES modules; opening the HTML file directly with `file://` may prevent module and asset loading due to browser security rules.

## Physics example

This example creates a static floor and a dynamic sphere. Add the world to your game's update flow and call `step(frameDeltaSeconds)` each frame. The world accumulates frame time and simulates fixed-size steps internally.

```js
import {
  Vector3,
  PhysicsWorld,
  RigidBody,
  SphereShape,
  BoxShape,
  Ray,
} from "./src/index.js";

const physics = new PhysicsWorld({
  gravity: new Vector3(0, -9.81, 0),
  fixedDeltaSeconds: 1 / 60,
  maxSubSteps: 5,
});

physics.addBody(new RigidBody({
  shape: new BoxShape(new Vector3(10, 0.5, 10)),
  mass: 0, // mass zero means immovable/static
  position: new Vector3(0, -1, 0),
}));

const ball = physics.addBody(new RigidBody({
  shape: new SphereShape(0.5),
  mass: 1,
  position: new Vector3(0, 3, 0),
  restitution: 0.2,
  friction: 0.6,
  continuous: true,
}));

physics.events.on("collisionenter", ({ a, b, contact }) => {
  console.log("Contact started", { a, b, contact });
});

function update(frameDeltaSeconds) {
  physics.step(frameDeltaSeconds);
  // ball.position is the simulated body position.
}

const hit = physics.raycast(
  new Ray(new Vector3(0, 5, 0), new Vector3(0, -1, 0)),
  { maxDistance: 100 },
);
if (hit) console.log("Ray hit at", hit.point, "distance", hit.distance);

const nearby = physics.queryAABB(
  new Vector3(-5, -5, -5),
  new Vector3(5, 5, 5),
  { includeTriggers: false },
);
```

### Collision filtering

`collisionLayer` and `collisionMask` are unsigned 32-bit bit fields. Two bodies can interact only when each body's mask includes the other's layer:

```js
const player = new RigidBody({
  shape: new SphereShape(0.5),
  collisionLayer: 0b0001,
  collisionMask: 0b0011,
});
```

Filtering affects both discrete collision candidates and the supported continuous sphere/box check. `isTrigger: true` reports trigger lifecycle events without applying physical separation/impulses.

### Body/entity synchronization

Pass an entity as the second argument to `physics.addBody(body, entity)` to synchronize body position with `entity.transform.position`. The current physics collider shapes do not use entity rotation; box colliders remain axis-aligned. If game code writes entity position before a physics step, that value becomes the body's starting position for that step.

## Rendering example

The included demo is the best starting point for inspecting the current renderer. The renderer uses WebGL 2 and GLSL ES 3.00; browsers without WebGL 2 support cannot run it. The renderer currently targets basic lit geometry rather than a complete physically based rendering pipeline.

```js
import { Renderer, Camera, Mesh, Material } from "./src/index.js";
```

See [`examples/rendering.html`](./examples/rendering.html) and [`examples/rendering-demo.js`](./examples/rendering-demo.js) for the working demo setup.

## Project structure

```text
src/
  assets/       glTF 2.0 / GLB 2.0 geometry loading
  core/         engine, scene, entity, component, transform
  math/         Vector3, Quaternion, Matrix4
  physics/      rigid bodies, collision shapes, PhysicsWorld
  rendering/    WebGL 2 renderer, camera, mesh, material, shaders
  systems/      input, events, resource loading
examples/       browser rendering demo
scripts/        local server and syntax checks
tests/          Node.js tests for math, core, rendering, systems, assets, physics
```

## Testing

Run all available automated checks:

```sh
npm run check
npm test
npm run ci
```

- `npm run check` checks JavaScript syntax in the source, examples, tests, and scripts included by the checker.
- `npm test` runs the Node.js built-in test suite.
- `npm run ci` runs both checks in sequence.

Unit tests can validate math, API contracts, simulation behavior, and regression scenarios, but they **do not replace real browser and GPU validation**. Before treating a release as stable, run the demo in supported browsers and test real WebGL 2 rendering, device-pixel-ratio resizing, resource cleanup, and longer physics sessions.

## Current limitations

This list is intentionally explicit so the README does not imply that planned features already exist.

- Rendering requires WebGL 2. There is no WebGPU backend or software fallback.
- Renderer materials and lighting are basic; there are no shadows, post-processing stack, environment maps, or complete PBR workflow.
- The glTF/GLB loader currently focuses on triangle geometry, POSITION, optional NORMAL and indices, buffers/accessors, and node transforms. It does not implement full material/texture import, skinning, animation, morph targets, sparse accessors, Draco compression, or full scene-to-renderer instantiation.
- Physics supports spheres and axis-aligned boxes only. Rotated boxes, convex hulls, triangle meshes, joints, angular velocity/inertia, sleeping, and general continuous collision detection are not implemented.
- The continuous sphere/box path is a targeted tunnelling mitigation, not a complete swept-shape solver. Complex, multiple, or moving-obstacle impacts require additional validation.
- Resource caching does not automatically manage every GPU resource lifetime for the application.
- No visual editor, scene authoring tool, audio system, networking layer, or production asset pipeline is included yet.
- There is no stable `1.0.0` API guarantee, npm publication, bundled runtime, or cross-browser release sign-off at this milestone.

## Roadmap

1. **Physics hardening:** broaden CCD coverage, improve contact stability, and add randomized/property-style regression tests.
2. **Renderer and lifecycle integration:** verify browser resize/DPR behavior, GPU resource disposal, and scene transitions in real browsers.
3. **Asset pipeline:** expand glTF materials/textures support and document supported accessor/primitive cases.
4. **Developer experience:** add reproducible browser automation, examples, API documentation, and performance baselines.
5. **Release readiness:** define public API boundaries, package/distribution strategy, license review, browser matrix, and a defensible release checklist.

A roadmap item is a plan, not a claim that the feature is implemented.

## Contributing and security

Please review [`CONTRIBUTING.md`](./CONTRIBUTING.md) before proposing changes. Do not include secrets, personal data, or proprietary assets in bug reports. Provide a minimal reproduction, runtime/browser versions, exact commands, and relevant logs when reporting an issue.

## License

**Proprietary — educational viewing only.** The repository may be publicly visible for inspection, but public visibility does not grant permission to copy, modify, redistribute, sublicense, or reuse the source code in other projects. See [`LICENSE`](./LICENSE) for the governing terms. Written permission from the rights holder is required for uses not expressly permitted by that license.

---

<div align="center">

**S3DWGE is being built one verified subsystem at a time.**

</div>
