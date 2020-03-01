import {
  AmbientLight,
  AxesHelper,
  Color,
  CubeGeometry,
  DirectionalLight,
  GridHelper,
  Mesh,
  MeshLambertMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";

import * as action from "../actions";

const NAME = "bitmap-worker";
// stop the demo after x renderers
const NUM_RENDER_FOR_DEMO = 300;

const makeScene = name => {
  const scene = new Scene();
  scene.autoUpdate = true;
  const color = new Color(0x222222); // it's a dark gray
  scene.background = color;
  scene.fog = null;
  // Any Three.js object in the scene (and the scene itself) can have a name.
  scene.name = name;

  const side = 30;
  const geometry = new CubeGeometry(side, side, side);
  const material = new MeshLambertMaterial({ color: 0xfbbc05 });
  const cube = new Mesh(geometry, material);
  cube.name = "Cube";
  cube.position.set(0, side / 2, 0);
  scene.add(cube);

  const gridHelper = new GridHelper(200, 16);
  gridHelper.name = "Floor GridHelper";
  scene.add(gridHelper);

  // XYZ axes helper (XYZ axes are RGB colors, respectively)
  const axesHelper = new AxesHelper(75);
  axesHelper.name = "XYZ AzesHelper";
  scene.add(axesHelper);

  const dirLight = new DirectionalLight(0x4682b4, 1); // steelblue
  dirLight.position.set(120, 30, -200);
  dirLight.castShadow = true;
  dirLight.shadow.camera.near = 10;
  scene.add(dirLight);

  const ambientLight = new AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);

  return scene;
};

const makeRenderer = canvas => {
  const gl = canvas.getContext("webgl");
  const renderer = new WebGLRenderer({
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
  return renderer;
};

const makeCamera = (canvas, scene) => {
  const fov = 75;
  // There are no clientWith and clientHeight in an OffscreenCanvas
  // const { clientWidth, clientHeight } = canvas;
  // const aspect = clientWidth / clientHeight;
  const aspect = canvas.width / canvas.height;
  const near = 0.1;
  const far = 10000;
  const camera = new PerspectiveCamera(fov, aspect, near, far);
  camera.name = "my-camera";
  camera.position.set(100, 100, 100);
  camera.lookAt(scene.position);

  return camera;
};

const init = payload => {
  const { height, sceneName, width } = payload;

  const canvas = new OffscreenCanvas(width, height);

  postMessage({
    action: action.NOTIFY,
    payload: { info: `[${NAME}] - building the scene` },
  });
  const scene = makeScene(sceneName);

  postMessage({
    action: action.NOTIFY,
    payload: { info: `[${NAME}] - building the renderer` },
  });
  const renderer = makeRenderer(canvas);

  postMessage({
    action: action.NOTIFY,
    payload: { info: `[${NAME}] - building the camera` },
  });
  const camera = makeCamera(canvas, scene);

  return {
    camera,
    canvas,
    counter: 0,
    renderer,
    scene,
  };
};

/**
 * Render the scene to the offscreen canvas, then create a bitmap and send it to
 * the main thread with a zero-copy operation.
 *
 * We call the transferToImageBitmap method on the offscreen canvas and send the
 * bitmap to the main thread synchronously.
 *
 * Note: requestAnimationFrame and cancelAnimationFrame are available for web
 * workers. But we can also use requestAnimationFrame in the main thread and
 * send a message to the web worker requesting a new bitmap when the main thread
 * needs it.
 */
const render = () => {
  // This web worker has some internal state. If these conditions are not
  // satisfied we crash and burn, so the main thread knows there is a problem.
  if (!state.renderer) {
    throw new Error(
      `Cannot call "render" without a renderer in ${NAME}'s state`
    );
  }
  if (!state.canvas) {
    throw new Error(`Cannot call "render" without a canvas in ${NAME}'s state`);
  }
  if (!state.camera) {
    throw new Error(`Cannot call "render" without a camera in ${NAME}'s state`);
  }
  if (!state.scene) {
    throw new Error(`Cannot call "render" without a scene in ${NAME}'s state`);
  }

  // Signal to the main thread that this web worker is done, this web worker's
  // heap can be freed. You can see that this web worker's heap disappears in
  // the Chrome Dev Tools Memory tab.
  if (state.counter > NUM_RENDER_FOR_DEMO) {
    postMessage({ action: action.KILL_ME });
  }

  // The web worker renders the scene in its OffscreenCanvas
  state.renderer.render(state.scene, state.camera);

  // The main thread has a `ImageBitmapRenderingContext`, so the web worker
  // needs to send back a `ImageBitmap`
  // https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap
  const bitmap = state.canvas.transferToImageBitmap();

  // In other use-cases the web-worker could send back a `Blob` with
  // `canvas.convertToBlob().then(blob => postMessage({ blob }, [blob]))`

  const message = {
    action: action.BITMAP,
    payload: { bitmap },
  };

  // ImageBitmap implements the Transerable interface, so we can send it to the
  // main WITHOUT using the structured clone algorithm. In other words, this
  // `postMessage` is a ZERO-COPY operation: we are passing the bitmap BY
  // REFERENCE and NOT BY VALUE.
  // https://developer.mozilla.org/en-US/docs/Web/API/Transferable
  // https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
  postMessage(message, [bitmap]);
};

let state = {
  camera: undefined,
  canvas: undefined,
  counter: undefined,
  renderer: undefined,
  scene: undefined,
};

const onMessage = event => {
  console.log(`%c${event.data.action}`, "color: red");
  switch (event.data.action) {
    case action.INIT:
      state = init(event.data.payload);
      break;
    case action.REQUEST_BITMAP: {
      state.counter++;
      state.camera.rotateZ(0.2);
      render();
      break;
    }
    default: {
      console.warn(`${NAME} received a message that does not handle`, event);
    }
  }
};
onmessage = onMessage;

// We could implement a render loop here, so the main thread would not need to
// send a REQUEST_BITMAP message to this web worker.
// const renderLoop = tick => {
//   state.camera.rotateZ(0.2);
//   render();
//   const reqId = requestAnimationFrame(renderLoop);
//   if (errorInWorker) {
//     cancelAnimationFrame(reqId);
//   }
// };
