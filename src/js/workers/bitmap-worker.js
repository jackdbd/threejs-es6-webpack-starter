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

import { BitmapWorkerAction, MainThreadAction } from "../worker-actions";

const NAME = "bitmap-worker";

// stop the demo after x renderers (just to test worker.terminate())
const NUM_RENDER_FOR_DEMO = 300;

// internal state of this web worker
const state = {};

/**
 * Initialize a Three.js scene in this web worker's state.
 */
const initScene = ({ name = "Default Scene name", addAxesHelpers = true }) => {
  const scene = new Scene();
  scene.autoUpdate = true;
  const color = new Color(0x222222); // it's a dark gray
  scene.background = color;
  scene.fog = null;
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

  if (addAxesHelpers) {
    // XYZ axes helper (XYZ axes are RGB colors, respectively)
    const axesHelper = new AxesHelper(75);
    axesHelper.name = "XYZ AzesHelper";
    scene.add(axesHelper);
  }

  const dirLight = new DirectionalLight(0x4682b4, 1); // steelblue
  dirLight.position.set(120, 30, -200);
  dirLight.castShadow = true;
  dirLight.shadow.camera.near = 10;
  scene.add(dirLight);

  const ambientLight = new AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);

  state.scene = scene;
  postMessage({
    action: BitmapWorkerAction.NOTIFY,
    payload: { info: `scene '${name}' initialized` },
    source: NAME,
  });
};

const initRenderer = () => {
  if (!state.canvas) {
    throw new Error("Cannot initialize a renderer without a canvas");
  }
  const gl = state.canvas.getContext("webgl");
  state.renderer = new WebGLRenderer({
    antialias: true,
    canvas: state.canvas,
  });

  state.renderer.setClearColor(0x222222); // it's a dark gray

  // We are not in the DOM, so we don't have access to  window.devicePixelRatio.
  // Maybe I could compute the aspect in the onscreen canvas and pass it here
  // within the message payload.
  state.renderer.setPixelRatio(1);

  // We are rendering offscreen, so there is no DOM and we cannot set the inline
  // style of the canvas.
  state.renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);

  state.renderer.shadowMap.enabled = true;

  postMessage({
    action: BitmapWorkerAction.NOTIFY,
    payload: { info: "renderer initialized" },
    source: NAME,
  });
};

const initCamera = ({
  aspect = 1,
  far = 10000,
  fov,
  name = "Default camera name",
  near = 0.1,
}) => {
  if (!state.scene) {
    throw new Error("Cannot initialize camera without a scene");
  }
  state.camera = new PerspectiveCamera(fov, aspect, near, far);
  state.camera.name = name;
  state.camera.position.set(100, 100, 100);
  state.camera.lookAt(state.scene.position);

  postMessage({
    action: BitmapWorkerAction.NOTIFY,
    payload: { info: `camera '${state.camera.name}' initialized` },
    source: NAME,
  });
};

const initState = payload => {
  const { height, sceneName, width } = payload;
  state.canvas = new OffscreenCanvas(width, height);

  initScene({ addAxesHelpers: false, sceneName });

  const cameraConfig = {
    aspect: state.canvas.width / state.canvas.height,
    fov: 75,
    name: "My Perspective Camera",
  };
  initCamera(cameraConfig);

  initRenderer();

  state.counter = 0;
};

const set2DRenderingContexts = resolutions => {
  const contexts = resolutions.map(r => {
    const canvas = new OffscreenCanvas(r.width, r.height);
    return canvas.getContext("2d");
  });
  state.contexts = contexts;
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
const render = resolutions => {
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

  // signal to the main thread that this web worker is done, so this worker's
  // heap can be freed. You can see that this web worker's heap disappears in
  // the Chrome Dev Tools Memory tab.
  if (state.counter > NUM_RENDER_FOR_DEMO) {
    state.scene.dispose();
    postMessage({ action: BitmapWorkerAction.TERMINATE_ME, source: NAME });
  }

  // render the scene in a "source" OffscreenCanvas only once
  state.renderer.render(state.scene, state.camera);

  // copy the "source" canvas to N "destination" canvases, one for each
  // requested bitmap
  const bitmaps = state.contexts.map((ctx, i) => {
    ctx.globalCompositeOperation = "copy";
    // ctx.fillStyle = "rgb(200,0,0)";
    // ctx.fillRect(10, 10, 55, 50);
    const { width, height } = resolutions[i];
    // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
    ctx.drawImage(state.canvas, 0, 0, width, height);
    return ctx.canvas.transferToImageBitmap();
  });

  // in other use-cases the web worker could send back a `Blob` with
  // `canvas.convertToBlob().then(blob => postMessage({ blob }, [blob]))`

  const message = {
    action: BitmapWorkerAction.BITMAPS,
    payload: { bitmaps },
    source: NAME,
  };

  // ImageBitmap implements the Transerable interface, so we can send it to the
  // main thread WITHOUT using the structured clone algorithm. In other words,
  // this `postMessage` is a ZERO-COPY operation: we are passing each bitmap BY
  // REFERENCE, NOT BY VALUE.
  // https://developer.mozilla.org/en-US/docs/Web/API/Transferable
  // https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
  postMessage(message, bitmaps);
};

const style = "color: red; font-weight: normal";

const onMessage = event => {
  const label = `[${event.data.source} --> ${NAME}] - ${event.data.action}`;
  // console.groupCollapsed(`%c${label}`, style);
  // if (event.data.payload) {
  //   console.log(`payload: ${JSON.stringify(event.data.payload)}`);
  //   // console.table(event.data);
  // }
  // console.groupEnd();
  console.log(`%c${label}`, style);

  switch (event.data.action) {
    case MainThreadAction.INIT_WORKER_STATE:
      initState(event.data.payload);
      break;
    case MainThreadAction.REQUEST_BITMAPS: {
      state.counter++;
      state.camera.rotateZ(0.2);
      set2DRenderingContexts(event.data.payload.resolutions);
      render(event.data.payload.resolutions);
      break;
    }
    default: {
      console.warn(`${NAME} received a message that does not handle`, event);
    }
  }
};
onmessage = onMessage;
