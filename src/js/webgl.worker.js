import * as THREE from "three";
import * as action from "./actions";

const makeScene = name => {
  const scene = new THREE.Scene();
  scene.autoUpdate = true;
  const color = new THREE.Color(0x222222); // it's a dark gray
  scene.background = color;
  scene.fog = null;
  // Any Three.js object in the scene (and the scene itself) can have a name.
  scene.name = name;

  const message = { payload: scene };
  postMessage(message);
};

const makeRenderer = canvas => {
  // const canvas = new OffscreenCanvas(512, 256);
  // canvas.aaa = "offscreen-canvas";
  const gl = canvas.getContext("webgl");
  // gl.drawingBufferWidth
  // gl.drawingBufferHeight
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas,
  });

  renderer.setClearColor(0x222222); // it's a dark gray

  // We are not in the DOM, so we don't have access to  window.devicePixelRatio.
  // Maybe I could compute the aspect in the onscreen canvas and pass it here
  // within the message payload.
  renderer.setPixelRatio(1);

  // We are rendering offscreen, so there is no DOM and we cannot set the inline
  // style of the canvas.
  const updateStyle = false;
  renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, updateStyle);

  renderer.shadowMap.enabled = true;

  console.warn("OFFSCREEN", canvas, gl, renderer);

  const message = { payload: renderer };
  postMessage(message);

  // return { canvas, gl, renderer };
};

const makeCamera = canvas => {
  const fov = 75;
  // There are no clientWith and clientHeight in an OffscreenCanvas
  // const { clientWidth, clientHeight } = canvas;
  // const aspect = clientWidth / clientHeight;
  const aspect = canvas.width / canvas.height;
  const near = 0.1;
  const far = 10000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.name = "my-camera";
  camera.position.set(100, 100, 100);
  // camera.lookAt(scene.position);

  const message = { payload: camera };
  postMessage(message);
  // return camera;
};

// function render(renderer, scene, camera, canvas) {
//   console.warn("render", canvas.aaa);
//   renderer.render(scene, camera);
// }

// requestAnimationFrame fires only once for OffscreenCanvas.
// requestAnimationFrame(cb);

// As an alternative, setInterval works and keeps firing.
// const ms = 1000;
// setInterval(cb, ms);

const init = payload => {
  const { canvas, sceneName } = payload;
  console.log(action.INIT, "self", self, "payload", payload);
  const delay = 5000;

  postMessage({
    action: action.NOTIFY,
    payload: { info: "building the scene" },
  });
  // makeScene(sceneName);

  postMessage({
    action: action.NOTIFY,
    payload: { info: "building the renderer" },
  });
  // makeRenderer(canvas);

  postMessage({
    action: action.NOTIFY,
    payload: { info: "building the camera" },
  });
  // makeCamera(canvas);

  const msg0 = {
    action: action.NOTIFY,
    payload: { info: `I will tell you to terminate me in ${delay}ms` },
  };
  postMessage(msg0);

  const cb = () => {
    const msg1 = { action: action.KILL_ME };
    postMessage(msg1);
  };
  setTimeout(cb, delay);
};

onmessage = event => {
  // console.log("Worker received", event.data);

  console.log(event.data.action);
  switch (event.data.action) {
    case action.INIT:
      init(event.data.payload);
      break;
    default:
      console.warn("Worker received a message that does not handle");
  }
};
