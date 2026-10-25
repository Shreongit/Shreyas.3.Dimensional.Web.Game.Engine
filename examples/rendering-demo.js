import { Camera, Entity, Material, Mesh, Renderer, RenderLoop, Scene, Vector3 } from "../src/index.js";

const canvas=document.querySelector("#game-canvas");
const status=document.querySelector("#status");
const toggle=document.querySelector("#toggle");
const fpsLabel=document.querySelector("#fps");
let renderer=null, mesh=null, loop=null, paused=false, frames=0, lastFpsTime=0;

function showError(error) {
  status.textContent=`Renderer error: ${error.message}`;
  status.classList.add("error");
  console.error(error);
}
try {
  renderer=new Renderer(canvas);
  const scene=new Scene("demo");
  const cube=new Entity("cube");
  mesh=Mesh.cube(renderer.gl);
  cube.mesh=mesh;
  cube.material=new Material({color:[0.15,0.65,0.98],ambient:0.24});
  scene.add(cube);
  const camera=new Camera({position:new Vector3(3,2.2,5),target:new Vector3(0,0,0),fovY:Math.PI/3,near:.1,far:100});
  loop=new RenderLoop({
    renderer,scene,camera,
    update(dt) {
      if(!paused) cube.transform.rotation.setFromAxisAngle(new Vector3(0,1,0),performance.now()/1800)
        .multiply(new (cube.transform.rotation.constructor)().setFromAxisAngle(new Vector3(1,0,0),performance.now()/2600));
      frames++;
      if(performance.now()-lastFpsTime>=500) {
        const elapsed=(performance.now()-lastFpsTime)/1000;
        fpsLabel.textContent=`FPS ${Math.round(frames/elapsed)}`;
        frames=0;lastFpsTime=performance.now();
      }
    },
    onError:showError
  });
  status.textContent="WebGL 2 ready";
  toggle.disabled=false;
  toggle.addEventListener("click",()=>{paused=!paused;toggle.textContent=paused?"Resume rotation":"Pause rotation";});
  loop.start();
  window.addEventListener("pagehide",()=>{loop?.dispose();mesh?.dispose();renderer?.dispose();},{once:true});
} catch(error) { showError(error); }
