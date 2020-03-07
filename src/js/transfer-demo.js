import TransferWorker from "./workers/transfer-worker";
import * as action from "./actions";
import { toggleMobileNav } from "./components/navbar";
import { makeLi } from "./helpers";
import "../css/index.css";

window.toggleMobileNav = toggleMobileNav;

// TODO: preload the web worker script with resource hints. Or is it done automatically by webpack's worker-loader?
// const workerUrl = document.querySelector("[rel=preload][as=script]").href;

(function iife() {
  const NAME = "Main thread";
  const worker = new TransferWorker();
  const canvas = document.getElementById("transfer-canvas");

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

  // const messages = document.querySelector(".messages");

  const onMessage = event => {
    const text = event.data.action;
    const style = "color: green; font-weight: normal";
    console.log(`%c${text}`, style);
    // const li = makeLi({
    //   text,
    //   style,
    // });
    // messages.appendChild(li);
    // messages.lastChild.scrollIntoView();

    switch (event.data.action) {
      case action.NOTIFY:
        console.log(event.data.payload.info);
        break;
      case action.KILL_ME:
        worker.terminate();
        console.warn("Main thread terminated the worker");
        break;
      default:
        console.warn("Main thread received a message that does not handle");
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
  const offscreenCanvas = canvas.transferControlToOffscreen();
  const message = {
    action: action.INIT,
    payload: { canvas: offscreenCanvas, sceneName: "my-scene" },
  };
  const transfer = [offscreenCanvas];
  worker.postMessage(message, transfer);

  const styleFromWorker = "color: red; font-weight: normal";
  // messages.appendChild(
  //   makeLi({
  //     text: `[${NAME} --> worker] ${message.action}`,
  //     style: styleFromWorker,
  //   })
  // );
  // messages.lastChild.scrollIntoView();

  const startButton = document.getElementById("start-render-loop");
  startButton.addEventListener("click", () => {
    worker.postMessage({ action: action.START_RENDER_LOOP });
    // messages.appendChild(
    //   makeLi({
    //     text: `[${NAME} --> worker] ${action.START_RENDER_LOOP}`,
    //     style: styleFromWorker,
    //   })
    // );
    // messages.lastChild.scrollIntoView();
  });

  const stopButton = document.getElementById("stop-render-loop");
  stopButton.addEventListener("click", () => {
    worker.postMessage({ action: action.STOP_RENDER_LOOP });
    // messages.appendChild(
    //   makeLi({
    //     text: `[${NAME} --> worker] ${action.STOP_RENDER_LOOP}`,
    //     style: styleFromWorker,
    //   })
    // );
    // messages.lastChild.scrollIntoView();
  });
})();
