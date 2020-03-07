import { BitmapWorkerAction, MainThreadAction } from "./worker-actions";
import { toggleMobileNav } from "./components/navbar";
import { makeLi } from "./helpers";
import "../css/index.css";

window.toggleMobileNav = toggleMobileNav;

// TODO: preload the web worker script with resource hints. Or is it done automatically by webpack's worker-loader?
// const workerUrl = document.querySelector("[rel=preload][as=script]").href;
(function iife() {
  const NAME = "Main thread";

  const bitmapWorker = new Worker("./workers/bitmap-worker.js", {
    type: "module",
  });

  // https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmapRenderingContext
  const bitmapsConfig = [
    {
      ctx: document
        .getElementById("low-res-bitmap-canvas")
        .getContext("bitmaprenderer"),
      resolution: { width: 160, height: 90 },
    },
    {
      ctx: document
        .getElementById("medium-res-bitmap-canvas")
        .getContext("bitmaprenderer"),
      resolution: { width: 640, height: 480 },
    },
    {
      ctx: document
        .getElementById("high-res-bitmap-canvas")
        .getContext("bitmaprenderer"),
      resolution: { width: 1024, height: 768 },
    },
  ];

  const resolutions = bitmapsConfig.reduce((accumul, curVal) => {
    return [...accumul, curVal.resolution];
  }, []);

  const style = "color: green; font-weight: normal";

  let reqId;

  const messages = document.querySelector(".messages");

  const onMessage = event => {
    const text = `[${NAME} <-- ${event.data.source}] - ${event.data.action}`;
    console.log(`%c${text}`, style);

    const li = makeLi({ text, style });
    messages.appendChild(li);
    messages.lastChild.scrollIntoView();

    switch (event.data.action) {
      case BitmapWorkerAction.BITMAPS: {
        const { bitmaps } = event.data.payload;
        bitmapsConfig.forEach((cfg, i) => {
          cfg.ctx.transferFromImageBitmap(bitmaps[i]);
        });
        break;
      }
      case BitmapWorkerAction.TERMINATE_ME: {
        bitmapWorker.terminate();
        console.warn(`${NAME} terminated ${event.data.source}`);
        // If the web worker is no longer listening, it makes no sense to keep
        // sending him messages in requestLoop;
        cancelAnimationFrame(reqId);
        break;
      }
      case BitmapWorkerAction.NOTIFY: {
        // we have already printed the message, so we simply break.
        break;
      }
      default: {
        console.warn(`${NAME} received a message that does not handle`, event);
      }
    }
  };

  // When a runtime error occurs in the worker, its onerror event handler is
  // called. It receives an event named error which implements the ErrorEvent
  // interface.
  // https://developer.mozilla.org/en-US/docs/Web/API/ErrorEvent
  let errorInWorker = undefined;
  const onError = event => {
    errorInWorker = event;
  };

  bitmapWorker.onmessage = onMessage;
  bitmapWorker.onerror = onError;

  const message = {
    action: MainThreadAction.INIT_WORKER_STATE,
    // width and height are for the OffscreenCanvas created by the web worker.
    // They will also be the width and height of the generated ImageBitmap
    // returned by the web-worker and rendered into the canvas that has a
    // `bitmaprenderer` context.
    payload: { width: 1024, height: 768, sceneName: "My Test Scene" },
    source: NAME,
  };
  bitmapWorker.postMessage(message);

  const li = makeLi({
    text: `[${NAME} --> worker] ${message.action}`,
    style: "color: red; font-weight: normal",
  });
  messages.appendChild(li);
  messages.lastChild.scrollIntoView();

  // Up until recently, requestAnimationFrame was not available in web workers,
  // so using requestAnimationFrame in the main thread was one of the possible
  // workarounds. Now I think it would be better to move requestAnimationFrame
  // to the web worker, so the main thread has less work to do.
  const requestLoop = tick => {
    bitmapWorker.postMessage({
      action: MainThreadAction.REQUEST_BITMAPS,
      payload: {
        resolutions,
      },
      source: NAME,
    });
    messages.appendChild(
      makeLi({
        text: `[${NAME} --> worker] ${MainThreadAction.REQUEST_BITMAPS}`,
        style: "color: red; font-weight: normal",
      })
    );
    messages.lastChild.scrollIntoView();
    reqId = requestAnimationFrame(requestLoop);
    if (errorInWorker) {
      cancelAnimationFrame(reqId);
    }
  };

  requestLoop();
})();
