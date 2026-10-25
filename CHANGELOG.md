# Changelog

## 0.5.0-advanced-physics.1
- Added optional continuous collision handling for moving spheres against static axis-aligned box colliders to mitigate tunnelling through thin walls.
- Added symmetric collision layer/mask filtering to discrete and supported continuous collision checks.
- Added `PhysicsWorld.queryAABB()` with trigger inclusion and predicate filtering.
- Validated collision filter bitmasks and hardened raycast max-distance validation.
- Rewrote README to explain the engine purpose, current capabilities, setup, examples, architecture, test commands, limitations, roadmap, and proprietary license without implying unfinished features are complete.
- Added regression coverage for collision filtering, continuous sphere/box tunnelling mitigation, AABB queries, and filter validation.

## 0.4.0-physics.1
- Added fixed-step PhysicsWorld, gravity and force/impulse integration.
- Added sphere and axis-aligned box colliders with collision resolution, restitution, friction, trigger/collision lifecycle events and sweep-and-prune broad phase.
- Added normalized rays and nearest-hit raycasting.
- Added physics API exports and focused regression tests.
- Scope limitations documented: no rotational inertia, joints, CCD or mesh colliders.

## 0.3.0-engine-systems.1
- Added EventEmitter with once, unsubscribe, and AbortSignal support.
- Added keyboard and pointer InputManager.
- Added ResourceManager with typed loaders, caching, de-duplication and invalidation.
- Added glTF 2.0 / GLB 2.0 triangle geometry loader with accessor bounds validation and generated normals.

## 0.2.0-renderer.1
- Added WebGL 2 renderer and resource lifecycle.
- Added perspective camera, indexed mesh, material and GLSL ES 3.00 shaders.
- Added depth testing, viewport resize handling, directional lighting and render loop.
- Added rotating cube demo and local development server.

## 0.1.0-foundation.1
- Established the initial math and engine-core foundation.
- Added basic Node.js tests and GitHub Actions CI workflow.
