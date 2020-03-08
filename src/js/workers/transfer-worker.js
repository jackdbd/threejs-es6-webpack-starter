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

import { MainThreadAction, WorkerAction } from "../worker-actions";
import { OBJLoader2 } from "../vendor/OBJLoader2";
import * as relativeURL from "../../models/male02.obj";

// https://bwasty.github.io/gltf-loader-ts/index.html
// https://github.com/KhronosGroup/glTF-Sample-Models/tree/master/2.0/
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_loader_gltf.html
import { GltfLoader } from "gltf-loader-ts";

const NAME = "transfer-worker";

const gltfLoader = new GltfLoader();

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

const tryGltf = uri => {
  return new Promise((resolve, reject) => {
    return gltfLoader
      .load(uri)
      .then(asset => {
        // console.log("tryGltf -> asset", asset);
        const gltf = asset.gltf;
        // console.log("GLTF", gltf);
        resolve(gltf);
      })
      .catch(err => {
        reject(err);
      });
  });
};

// async function tryGltf(uri) {
//   const asset = await gltfLoader.load(uri);
//   console.log("tryGltf -> asset", asset);
//   let gltf = asset.gltf;
//   console.log("GLTF", gltf);
//   // let data = await asset.accessorData(0); // fetches BoxTextured0.bin
//   // let image: Image = await asset.imageData.get(0); // fetches CesiumLogoFlat.png
// }

const init = payload => {
  const { canvas, sceneName } = payload;

  postMessage({
    action: WorkerAction.NOTIFY,
    payload: { info: `[${NAME}] - scene initialized` },
    source: NAME,
  });
  const scene = makeScene(sceneName);

  postMessage({
    action: WorkerAction.NOTIFY,
    payload: { info: `[${NAME}] - renderer inizialized` },
    source: NAME,
  });
  const renderer = makeRenderer(canvas);

  postMessage({
    action: WorkerAction.NOTIFY,
    payload: { info: `[${NAME}] - camera inizialized` },
    source: NAME,
  });
  const camera = makeCamera(canvas, scene);

  const onManagerLoad = () => {
    postMessage({
      action: WorkerAction.NOTIFY,
      payload: {
        info: `[${NAME}] - Loaded all items`,
      },
      source: NAME,
    });
  };

  const onManagerProgress = (item, loaded, total) => {
    // console.log("LoadingManager progress:", item, loaded, total);
    postMessage({
      action: WorkerAction.NOTIFY,
      payload: {
        info: `[${NAME}] - Loaded ${loaded} of ${total} items`,
      },
      source: NAME,
    });
  };

  const onManagerStart = (url, itemsLoaded, itemsTotal) => {
    postMessage({
      action: WorkerAction.NOTIFY,
      payload: {
        info: `[${NAME}] - started loading file ${url} (Loaded ${itemsLoaded} of ${itemsTotal} items)`,
      },
      source: NAME,
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

  const objURL = PUBLIC_URL.includes("github.io")
    ? `${PUBLIC_URL}/${relativeURL}`
    : `http://localhost:8080/${relativeURL}`;

  console.log(
    "=== PUBLIC_URL ===",
    PUBLIC_URL,
    "relativeURL",
    relativeURL,
    "objURL (3D model)",
    objURL
  );

  objLoader.load(objURL, object3D => {
    object3D.name = "male02";
    scene.add(object3D);
  });

  const onObjectLoad = object3D => {
    // console.log("=== object3D ===", object3D);
    const name = object3D.name || "unnamed-object";
    const info = `[${NAME}] - Loaded ${name} (geometry: ${object3D.geometry.type}, material: ${object3D.material.type})`;
    postMessage({
      action: WorkerAction.NOTIFY,
      payload: {
        info,
      },
      source: NAME,
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
        action: WorkerAction.NOTIFY,
        payload: {
          info: `[${NAME}] - downloading model (${percentComplete}%)`,
        },
        source: NAME,
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
      action: WorkerAction.NOTIFY,
      payload: {
        info,
      },
      source: NAME,
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

  tryGltf(
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxTextured/glTF/BoxTextured.gltf"
  )
    .then(glft => {
      console.log("glft", glft);
      //   scene.add( gltf.scene );

      // gltf.animations; // Array<THREE.AnimationClip>
      // gltf.scene; // THREE.Group
      // gltf.scenes; // Array<THREE.Group>
      // gltf.cameras; // Array<THREE.Camera>
      // gltf.asset; // Object
    })
    .catch(err => {
      console.log("err with gltf", err);
    });

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
    action: WorkerAction.NOTIFY,
    payload: { info: `[${NAME}] - render loop` },
    source: NAME,
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

const style = "color: red; font-weight: normal";

const onMessage = event => {
  // console.log(`%c${event.data.action}`, "color: red");
  const text = `[${event.data.source} --> ${NAME}] - ${event.data.action}`;
  console.log(`%c${text}`, style);

  switch (event.data.action) {
    case MainThreadAction.INIT_WORKER_STATE: {
      console.log("SELF NAME (DedicatedWorkerGlobalScope name)", self.name);
      init(event.data.payload);
      break;
    }
    case MainThreadAction.START_RENDER_LOOP: {
      renderLoop();
      break;
    }
    case MainThreadAction.STOP_RENDER_LOOP: {
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
      action: WorkerAction.NOTIFY,
      payload: {
        info: `[${NAME}] - error: ${state.error.message}. Please terminate me.`,
      },
      source: NAME,
    });
    cancelAnimationFrame(state.reqId);
    postMessage({ action: WorkerAction.TERMINATE_ME, source: NAME });
  } else {
    state.reqId = requestAnimationFrame(renderLoop);
  }
};
