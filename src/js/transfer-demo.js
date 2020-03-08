import { toggleMobileNav } from "./components/navbar";
import { makeLi } from "./helpers";
import {
  ButtonIds,
  CanvasIds,
  unsupportedOffscreenCanvasAlertMessage,
} from "./constants";
import { MainThreadAction, WorkerAction } from "./worker-actions";
import "../css/index.css";

window.toggleMobileNav = toggleMobileNav;

// TODO: preload the web worker script with resource hints. Or is it done automatically by webpack's worker-loader?
// const workerUrl = document.querySelector("[rel=preload][as=script]").href;

(function iife() {
  const NAME = "Main thread";

  let worker = new Worker("./workers/transfer-worker.js", {
    name: `transfer-worker-original`,
    type: "module",
  });

  const canvas = document.getElementById(CanvasIds.TRANSFER_CONTROL);

  // TODO: handle resize of the canvas

  const handleResize = event => {
    console.warn(event);
    // const { clientWidth, clientHeight } = this.container;
    console.log(
      "handleResize",
      // clientWidth,
      // clientHeight,
      this
    );
    // this.camera.aspect = clientWidth / clientHeight;
    // this.camera.updateProjectionMatrix();
    // this.renderer.setSize(clientWidth, clientHeight);
  };

  window.addEventListener("resize", handleResize);

  const messages = document.querySelector(".messages ol");

  const onMessage = event => {
    const text = `[${NAME} <-- ${event.data.source}] - ${event.data.action}`;
    const style = "color: green; font-weight: normal";
    console.log(`%c${text}`, style);
    const li = makeLi({
      text,
      style,
    });
    messages.appendChild(li);
    messages.lastChild.scrollIntoView();

    switch (event.data.action) {
      case WorkerAction.NOTIFY:
        console.log(event.data.payload.info);
        break;
      case WorkerAction.TERMINATE_ME:
        worker.terminate();
        console.warn("Main thread terminated the worker");
        break;
      default:
        console.warn(`${NAME} received a message that does not handle`, event);
    }
  };

  const onError = event => {
    console.error("Error in web worker", event);
    alert(`${event.message} - ${event.filename}. See console for more.`);
  };

  worker.onmessage = onMessage;
  worker.onerror = onError;

  // The width and height of the visible canvas will be used to set the size of
  // WebGL drawing buffer. BUT we cannot create a WebGLRenderingContext with
  // canvas.getContext("webgl") here because we need to transfer the ownership
  // of the canvas to the web worker's OffscreenCanvas. If we try to create the
  // context here we get the following error: Uncaught DOMException: Failed to
  // execute 'transferControlToOffscreen' on 'HTMLCanvasElement': Cannot
  // transfer control from a canvas that has a rendering context.
  // So we create the WebGL rendering context in the web worker.
  // https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
  canvas.setAttribute("width", "1024");
  canvas.setAttribute("height", "768");
  if (!canvas.transferControlToOffscreen) {
    alert(unsupportedOffscreenCanvasAlertMessage);
  }
  const offscreenCanvas = canvas.transferControlToOffscreen();
  const message = {
    action: MainThreadAction.INIT_WORKER_STATE,
    payload: { canvas: offscreenCanvas, sceneName: "my-scene" },
    source: NAME,
  };
  const transfer = [offscreenCanvas];
  worker.postMessage(message, transfer);

  const styleFromWorker = "color: red; font-weight: normal";
  messages.appendChild(
    makeLi({
      text: `[${NAME} --> worker] ${message.action}`,
      style: styleFromWorker,
    })
  );
  messages.lastChild.scrollIntoView();

  const startButton = document.getElementById(ButtonIds.START_RENDER_LOOP);
  startButton.addEventListener("click", () => {
    worker.postMessage({
      action: MainThreadAction.START_RENDER_LOOP,
      source: NAME,
    });
    messages.appendChild(
      makeLi({
        text: `[${NAME} --> worker] ${MainThreadAction.START_RENDER_LOOP}`,
        style: styleFromWorker,
      })
    );
    messages.lastChild.scrollIntoView();
  });

  const stopButton = document.getElementById(ButtonIds.STOP_RENDER_LOOP);
  stopButton.addEventListener("click", () => {
    worker.postMessage({
      action: MainThreadAction.STOP_RENDER_LOOP,
      source: NAME,
    });
    messages.appendChild(
      makeLi({
        text: `[${NAME} --> worker] ${MainThreadAction.STOP_RENDER_LOOP}`,
        style: styleFromWorker,
      })
    );
    messages.lastChild.scrollIntoView();
  });

  const terminateButton = document.getElementById(ButtonIds.TERMINATE_WORKER);
  terminateButton.addEventListener("click", () => {
    worker.terminate();
  });

  const instantiateButton = document.getElementById(
    ButtonIds.INSTANTIATE_WORKER
  );
  instantiateButton.addEventListener("click", () => {
    // We create a new worker but reuse the same variable. Otherwise we would
    // need to redefine the onmessage and onerror handlers.
    const workerId = Math.ceil(Math.random() * 1000);
    worker = new Worker("./workers/transfer-worker.js", {
      name: `transfer-worker-${workerId}`,
      type: "module",
    });
    // It seems that there is no way of getting the control of the canvas back,
    // so we clone the original canvas and replace it in the DOM with the clone.
    // https://stackoverflow.com/a/46575483/3036129
    const oldCanvas = document.getElementById(CanvasIds.TRANSFER_CONTROL);
    const newCanvas = oldCanvas.cloneNode();
    oldCanvas.parentNode.replaceChild(newCanvas, oldCanvas);
    // The control of the new, cloned canvas belongs to the main thread, so we
    // can transfer it to the OffscreenCanvas controlled by the worker.
    const anotherOffscreenCanvas = newCanvas.transferControlToOffscreen();
    const msg = {
      action: MainThreadAction.INIT_WORKER_STATE,
      payload: { canvas: anotherOffscreenCanvas, sceneName: "another-scene" },
      source: NAME,
    };
    worker.postMessage(msg, [anotherOffscreenCanvas]);
  });
})();
