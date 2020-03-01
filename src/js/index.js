import { Application } from "./application";
import BitmapWorker from "./workers/bitmap-worker";
// import WebGLWorker from "./workers/webgl.worker";
import * as action from "./actions";

import "../css/index.css";

// TODO: preload the web worker script with resource hints. Or is it done automatically by webpack's worker-loader?
// const workerUrl = document.querySelector("[rel=preload][as=script]").href;

// wrap everything inside a function scope and invoke it (IIFE, a.k.a. SEAF)
(() => {
  const containers = document.getElementsByClassName("canvas-container");
  // console.log("containers", containers);
  const canvas = document.querySelector("#onscreen-canvas");
  // console.log("canvas", canvas);
  let app = null;
  if (containers.length === 0) {
    app = new Application({ showHelpers: true, canvas });
  } else if (containers.length === 1) {
    app = new Application({
      canvas,
      container: containers[0],
      showHelpers: true,
    });
  } else {
    alert("Too many <div class='canvas-container' /> elements in your HTML");
  }
  console.log("Application instance", app);

  // const worker = new WebGLWorker();
  const bitmapWorker = new BitmapWorker();

  const canvasName = "test-canvas";
  const canvasId = `#${canvasName}`;
  const onscreenCanvas = document.querySelector(canvasId);

  const canvasBitmap = document
    .getElementById("bitmap-canvas")
    .getContext("bitmaprenderer");

  const onMessage = event => {
    //   console.log("Main thread received", event.data);

    console.log(`%c${event.data.action}`, "color: green");
    switch (event.data.action) {
      case action.NOTIFY:
        console.log(event.data.payload.info);
        break;
      case action.BITMAP:
        canvasBitmap.transferFromImageBitmap(event.data.payload.bitmap);
        break;
      case action.KILL_ME:
        // worker.terminate();
        console.warn("Main thread terminated the worker");
        break;
      default:
        console.warn("Main thread received a message that does not handle");
    }
  };

  const onError = event => {
    console.warn("FUCK! It didn't work!", event);
  };

  // worker.onmessage = onMessage;
  // worker.onerror = onError;

  bitmapWorker.onmessage = onMessage;
  bitmapWorker.onerror = onError;

  onscreenCanvas.setAttribute("width", "600");
  onscreenCanvas.setAttribute("height", "400");
  const offscreenCanvas = onscreenCanvas.transferControlToOffscreen();
  const message = {
    action: action.INIT,
    payload: { canvas: offscreenCanvas, sceneName: "my-scene" },
  };
  const transfer = [offscreenCanvas];
  // worker.postMessage(message, transfer);
  bitmapWorker.postMessage(message, transfer);

  // let useBitmapCanvas = false;

  // const renderLoop = tick => {
  //   worker.postMessage({
  //     action: action.REQUEST_FRAME,
  //     payload: { useBitmapCanvas },
  //   });
  //   useBitmapCanvas = !useBitmapCanvas;
  //   requestAnimationFrame(renderLoop);
  // };

  // renderLoop(performance.now());

  // const renderLoop = () => {
  //   worker.postMessage({
  //     action: action.REQUEST_FRAME,
  //     payload: { useBitmapCanvas },
  //   });
  //   useBitmapCanvas = !useBitmapCanvas;
  // };

  // const renderLoop = () => {
  //   bitmapWorker.postMessage({
  //     action: action.REQUEST_BITMAP,
  //   });
  // };

  const renderLoop = tick => {
    bitmapWorker.postMessage({
      action: action.REQUEST_BITMAP,
    });
    requestAnimationFrame(renderLoop);
  };

  renderLoop();

  // setInterval(renderLoop, 1000);
})();
