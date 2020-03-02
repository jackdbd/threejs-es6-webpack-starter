import {
  AmbientLight,
  AxesHelper,
  CanvasTexture,
  Color,
  CubeGeometry,
  DirectionalLight,
  GridHelper,
  ImageBitmapLoader,
  LoadingManager,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  ObjectLoader,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";

import * as action from "../actions";

import { OBJLoader2 } from "../vendor/OBJLoader2";
const NAME = "transfer-worker";

const makeScene = name => {
  const scene = new Scene();
  scene.autoUpdate = true;
  const color = new Color(0x222222); // it's a dark gray
  scene.background = color;
  scene.fog = null;
  // Any Three.js object in the scene (and the scene itself) can have a name.
  scene.name = name;

  const side = 10;
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

  const onManagerLoad = () => {
    postMessage({
      action: action.NOTIFY,
      payload: {
        info: `[${NAME}] - Loaded all items`,
      },
    });
  };

  const onManagerProgress = (item, loaded, total) => {
    // console.log("LoadingManager progress:", item, loaded, total);
    postMessage({
      action: action.NOTIFY,
      payload: {
        info: `[${NAME}] - Loaded ${loaded} of ${total} items`,
      },
    });
  };

  const onManagerStart = (url, itemsLoaded, itemsTotal) => {
    postMessage({
      action: action.NOTIFY,
      payload: {
        info: `[${NAME}] - started loading file ${url} (Loaded ${itemsLoaded} of ${itemsTotal} items)`,
      },
    });
  };

  const onManagerError = error => {
    console.error("ERROR IN LOADING MANAGER", error);
  };

  const manager = new LoadingManager(
    onManagerLoad,
    onManagerProgress,
    onManagerError
  );
  manager.onStart = onManagerStart;

  const objectLoader = new ObjectLoader(manager);
  const bitmapLoader = new ImageBitmapLoader(manager);
  bitmapLoader.setOptions({ imageOrientation: "flipY" });

  const objLoader = new OBJLoader2(manager);

  const objURL =
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/obj/male02/male02.obj";
  objLoader.load(objURL, object3D => {
    // console.log("=== object3D ===", object3D);
    object3D.name = "male02";
    scene.add(object3D);
  });

  const onObjectLoad = object3D => {
    // console.log("=== object3D ===", object3D);
    const name = object3D.name || "unnamed-object";
    const info = `[${NAME}] - Loaded ${name} (geometry: ${object3D.geometry.type}, material: ${object3D.material.type})`;
    postMessage({
      action: action.NOTIFY,
      payload: {
        info,
      },
    });
    // object3D.traverse(function(child) {
    //   console.log("child", child);
    //   if (child.isMesh) {
    //     child.material.map = texture;
    //   }
    // });
    object3D.position.set(50, 0, 50);
    object3D.scale.set(15, 15, 15);
    state.scene.add(object3D);
  };

  const onProgress = xhr => {
    if (xhr.lengthComputable) {
      const percentComplete = Math.round((xhr.loaded / xhr.total) * 100);
      postMessage({
        action: action.NOTIFY,
        payload: {
          info: `[${NAME}] - downloading model (${percentComplete}%)`,
        },
      });
    }
  };

  const onError = error => {
    console.error("ERROR IN LOADER", error);
  };

  const url =
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/json/teapot-claraio.json";
  objectLoader.load(url, onObjectLoad, onProgress, onError);

  // This one fails because it tries to access `window`, which of course is not
  // available in a web worker.
  // const url2 =
  //   "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/json/multimaterial.json";
  // objectLoader.load(url2, onLoad, onProgress, onError);

  const onBitmapLoad = bitmap => {
    const info = `[${NAME}] - Loaded bitmap (${bitmap.width}x${bitmap.height})`;
    postMessage({
      action: action.NOTIFY,
      payload: {
        info,
      },
    });
    const texture = new CanvasTexture(bitmap);
    const materialWithTexture = new MeshBasicMaterial({ map: texture });

    const geom = new CubeGeometry(30, 30, 30);
    const cube = new Mesh(geom, materialWithTexture);
    cube.name = "Cube with textured material";
    cube.position.set(-50, 50, 50);
    scene.add(cube);
  };

  bitmapLoader.load(
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg",
    onBitmapLoad,
    // onProgress callback currently not supported
    undefined,
    onError
  );

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
  const male02 = state.scene.getObjectByName("male02");
  // console.log("Math.sin(tick)", Math.sin(tick));
  male02.rotateY(0.03);
  // male02.rotateZ(0.05);
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
  // state.camera.rotateZ(0.05);
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
