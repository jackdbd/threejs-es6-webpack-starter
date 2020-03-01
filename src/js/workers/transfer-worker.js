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

const NAME = "transfer-worker";

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
  // camera.position.set(100, 100, 100);
  // Axes Helpers: RED (X), GREEN (Y), BLUE (Z)
  camera.position.set(100, 50, 200);
  camera.lookAt(scene.position);

  return camera;
};

const init = payload => {
  const { canvas, sceneName } = payload;

  postMessage({
    action: action.NOTIFY,
    payload: { info: `[${NAME}] - scene initialized` },
  });
  const scene = makeScene(sceneName);

  postMessage({
    action: action.NOTIFY,
    payload: { info: `[${NAME}] - renderer inizialized` },
  });
  const renderer = makeRenderer(canvas);

  postMessage({
    action: action.NOTIFY,
    payload: { info: `[${NAME}] - camera inizialized` },
  });
  const camera = makeCamera(canvas, scene);

  state.camera = camera;
  state.canvas = canvas;
  state.error = undefined;
  state.renderer = renderer;
  state.reqId = performance.now();
  state.scene = scene;
};

/**
 * Render the scene to the offscreen canvas.
 *
 * The scene rendered in the offscreen canvas appears automatically on the
 * onscreen canvas because the main thread transferred the ownership of the
 * rendering context to the offscreen canvas managed by this web worker.
 * The onscreen canvas is updated automatically and asynchronously.
 */
const render = tick => {
  // We could use the tick to control the animation.
  if (!state.renderer) {
    state.error = new Error(
      `Cannot call "render" without a renderer in ${NAME}'s state`
    );
    return;
  }
  if (!state.canvas) {
    state.error = new Error(
      `Cannot call "render" without a canvas in ${NAME}'s state`
    );
    return;
  }
  if (!state.camera) {
    state.error = new Error(
      `Cannot call "render" without a camera in ${NAME}'s state`
    );
    return;
  }
  if (!state.scene) {
    state.error = new Error(
      `Cannot call "render" without a scene in ${NAME}'s state`
    );
    return;
  }

  // If we made it here, the web worker can safely render the scene.
  state.renderer.render(state.scene, state.camera);

  // Maybe the main thread is interested in knowing what this web worker is
  // doing, so we notify it about what has been done. Please note that the main
  // thread doesn't have to do anything, and CANNOT do anything on the canvas on
  // the screen, because it transferred the ownership of that canvas to the web
  // worker. So basically the visible, onscreen canvas is just a proxy for the
  // offscreen canvas.
  postMessage({
    action: action.NOTIFY,
    payload: { info: `[${NAME}] - render loop` },
  });
};

let state = {
  camera: undefined,
  canvas: undefined,
  error: undefined,
  renderer: undefined,
  reqId: undefined,
  scene: undefined,
};

const onMessage = event => {
  console.log(`%c${event.data.action}`, "color: red");
  switch (event.data.action) {
    case action.INIT:
      init(event.data.payload);
      break;
    case action.START_RENDER_LOOP: {
      renderLoop();
      break;
    }
    case action.STOP_RENDER_LOOP: {
      cancelAnimationFrame(state.reqId);
      break;
    }
    default: {
      console.warn(`${NAME} received a message that does not handle`, event);
    }
  }
};
onmessage = onMessage;

const renderLoop = tick => {
  state.camera.rotateZ(0.05);
  render(tick);
  if (state.error) {
    postMessage({
      action: action.NOTIFY,
      payload: {
        info: `[${NAME}] - error: ${state.error.message}. Please terminate me.`,
      },
    });
    cancelAnimationFrame(state.reqId);
    postMessage({ action: action.KILL_ME });
  } else {
    state.reqId = requestAnimationFrame(renderLoop);
  }
};
