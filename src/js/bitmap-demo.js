// import { Application } from "./application";
import BitmapWorker from "./workers/bitmap-worker";
import * as action from "./actions";

import "../css/index.css";

// TODO: preload the web worker script with resource hints. Or is it done automatically by webpack's worker-loader?
// const workerUrl = document.querySelector("[rel=preload][as=script]").href;

(function iife() {
  const bitmapWorker = new BitmapWorker();

  const canvasBitmap = document.getElementById("bitmap-canvas");

  // canvasBitmap.setAttribute("width", `${width}`);
  // canvasBitmap.setAttribute("height", `${height}`);
  const ctx = canvasBitmap.getContext("bitmaprenderer");

  // const anotherCanvas = document.getElementById("another-bitmap-canvas");
  // const anotherCtx = anotherCanvas.getContext("bitmaprenderer");

  const onMessage = event => {
    console.log(`%c${event.data.action}`, "color: green");
    switch (event.data.action) {
      case action.BITMAP:
        ctx.transferFromImageBitmap(event.data.payload.bitmap);
        // anotherCtx.transferFromImageBitmap(event.data.payload.bitmap);
        break;
      case action.KILL_ME:
        bitmapWorker.terminate();
        console.warn("Main thread terminated the worker");
        break;
      case action.NOTIFY:
        console.log(`%c${event.data.payload.info}`, "color: green");
        break;
      default:
        console.warn(
          "Main thread received a message that does not handle",
          event
        );
    }
  };

  let errorInWorker = undefined;
  const onError = error => {
    errorInWorker = error;
  };

  bitmapWorker.onmessage = onMessage;
  bitmapWorker.onerror = onError;

  const message = {
    action: action.INIT,
    // width and height are for the OffscreenCanvas created by the web worker.
    // They will also be the width and height of the generated ImageBitmap
    // returned by the web-worker and rendered into the canvas that has a
    // `bitmaprenderer` context.
    payload: { width: 1024, height: 768 },
  };
  bitmapWorker.postMessage(message);

  const renderLoop = tick => {
    bitmapWorker.postMessage({
      action: action.REQUEST_BITMAP,
    });
    const reqId = requestAnimationFrame(renderLoop);
    if (errorInWorker) {
      cancelAnimationFrame(reqId);
    }
  };

  renderLoop();
})();
