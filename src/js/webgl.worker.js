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
import * as action from "./actions";

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

const draw = canvas => {
  const ctx = canvas.getContext("2d");

  const x0 = 0;
  const y0 = 0;
  const x1 = canvas.width;
  const y1 = canvas.height / 2;
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
  gradient.addColorStop(0, "red");
  gradient.addColorStop(1, "blue");
  ctx.fillStyle = gradient;

  const x = 0;
  const y = 0;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height / 2;
  ctx.fillRect(x, y, width, height);

  postMessage({
    action: action.NOTIFY,
    payload: { info: "Finished drawing canvas in worker thread" },
  });
};

const init = payload => {
  const { canvas, sceneName } = payload;
  console.log(action.INIT, "self", self);

  const delay = 10000;
  postMessage({
    action: action.NOTIFY,
    payload: { info: `This demo will end in ${delay}ms` },
  });

  // Use a second canvas and second renderer to clear #bitmap-canvas when we
  // are rendering #onscreen-canvas
  const canvasCleared = new OffscreenCanvas(canvas.width, canvas.height);
  const rendererCleared = makeRenderer(canvasCleared);

  // draw(canvas);

  postMessage({
    action: action.NOTIFY,
    payload: { info: "building the scene" },
  });
  const scene = makeScene(sceneName);

  postMessage({
    action: action.NOTIFY,
    payload: { info: "building the renderer" },
  });
  const renderer = makeRenderer(canvas);

  postMessage({
    action: action.NOTIFY,
    payload: { info: "building the camera" },
  });
  const camera = makeCamera(canvas, scene);

  return {
    camera,
    canvas,
    canvasCleared,
    renderer,
    rendererCleared,
    scene,
  };
};

/**
 * Render the scene to the offscreen canvas, then transfer context to target
 * onscreen canvas (either #onscreen-canvas or #bitmap-canvas).
 *
 * Either we do nothing and let the scene rendered in the offscreen canvas be
 * sent to #onscreen-canvas automatically and asynchronously, or we explicitly
 * call the transferToImageBitmap method on the offscreen canvas and send the
 * rendered scene to #bitmap-canvas synchronously.
 *
 * requestAnimationFrame is not (yet) available for web workers. But we have a
 * few alternatives to implement a render loop:
 *
 * - use setInterval in the web worker.
 * - use requestAnimationFrame in the main thread and send a message requesting
 *   a new frame for each animation tick.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
 * @see https://hacks.mozilla.org/2016/01/webgl-off-the-main-thread/
 * @see https://wiki.whatwg.org/wiki/OffscreenCanvas.requestAnimationFrame
 */
const render = (
  renderer,
  scene,
  camera,
  useBitmapCanvas,
  canvas,
  canvasCleared,
  rendererCleared
) => {
  renderer.render(scene, camera);

  let message;
  let bitmap;
  let transfer;
  if (useBitmapCanvas) {
    postMessage({
      action: action.NOTIFY,
      payload: { info: "render scene in #bitmap-canvas" },
    });
    bitmap = canvas.transferToImageBitmap();
    message = {
      action: action.BITMAP,
      payload: { bitmap },
    };
    transfer = [bitmap];
    postMessage(message, transfer);
  } else {
    rendererCleared.clear();
    bitmap = canvasCleared.transferToImageBitmap();
    message = {
      action: action.BITMAP,
      payload: { bitmap },
    };
    transfer = [bitmap];
    postMessage(message, transfer);
    postMessage({
      action: action.NOTIFY,
      payload: { info: "render scene in #onscreen-canvas" },
    });
  }
};

let state = {
  camera: undefined,
  canvas: undefined,
  canvasCleared: undefined,
  renderer: undefined,
  rendererCleared: undefined,
  scene: undefined,
};

onmessage = event => {
  console.log(`%c${event.data.action}`, "color: red");
  switch (event.data.action) {
    case action.INIT:
      state = init(event.data.payload);
      break;
    case action.REQUEST_FRAME:
      const useBitmapCanvas = event.data.payload.useBitmapCanvas;
      render(
        state.renderer,
        state.scene,
        state.camera,
        useBitmapCanvas,
        state.canvas,
        state.canvasCleared,
        state.rendererCleared
      );
      break;
    default:
      console.warn("Worker received a message that does not handle");
  }
};
