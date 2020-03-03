import { toggleMobileNav } from "./components/navbar";
import { makeLi } from "./helpers";
import "../css/index.css";

window.toggleMobileNav = toggleMobileNav;

(function iife() {
  const NAME = "Main thread";
  // public path to the shared web worker script:
  // const sharedWorkerUrl = "http://localhost:8080/shared-worker.js"; // development
  const sharedWorkerUrl = `${WEB_WORKERS_PUBLIC_PATH}shared-worker.js`; // development
  // const sharedWorkerUrl =
  //   "http://localhost:8090/shared-web-workers/shared-worker.js"; //production
  console.log("WEB_WORKERS_PUBLIC_PATH", WEB_WORKERS_PUBLIC_PATH);

  // Shared workers still not supported in worker-plugin 3.2.0 (but they will
  // likely be supported soon).
  const sharedWorker = new SharedWorker(
    sharedWorkerUrl,
    "My shared worker global scope"
  );

  // https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmapRenderingContext
  const bitmapsConfig = [
    {
      ctx: document.getElementById("canvas-0").getContext("bitmaprenderer"),
      resolution: { width: 160, height: 90 },
    },
    {
      ctx: document.getElementById("canvas-1").getContext("bitmaprenderer"),
      resolution: { width: 640, height: 480 },
    },
  ];

  // const resolutions = bitmapsConfig.reduce((accumul, curVal) => {
  //   return [...accumul, curVal.resolution];
  // }, []);

  const messages = document.querySelector(".messages");
  const styleFromMain = "color: red; font-weight: normal";
  const styleFromWorker = "color: green; font-weight: normal";

  const onSharedError = event => {
    console.log("onSharedError -> event", event);
  };
  sharedWorker.onerror = onSharedError;

  sharedWorker.port.onmessageerror = function(event) {
    console.log("Message ERROR received from SHARED worker", event);
  };

  sharedWorker.port.start();

  sharedWorker.port.postMessage({
    action: "INIT_SHARED_WORKER",
    payload: {
      aaa: "do it now",
    },
    source: NAME,
  });
  messages.appendChild(
    makeLi({
      text: `[${NAME} --> shared worker] - INIT_SHARED_WORKER`,
      style: styleFromMain,
    })
  );
  messages.lastChild.scrollIntoView();

  sharedWorker.port.postMessage({
    action: "FOO",
    source: NAME,
  });
  messages.appendChild(
    makeLi({
      text: `[${NAME} --> shared worker] - FOO`,
      style: styleFromMain,
    })
  );
  messages.lastChild.scrollIntoView();

  sharedWorker.port.postMessage({
    action: "GIVE_BITMAPS",
    // payload: {
    //   resolutions,
    // },
    source: NAME,
  });
  messages.appendChild(
    makeLi({
      text: `[${NAME} --> shared worker] - GIVE_BITMAPS`,
      style: styleFromMain,
    })
  );
  messages.lastChild.scrollIntoView();

  sharedWorker.port.onmessage = function(e) {
    console.log("Message received from worker", e);
    console.log(e.data);
    if (e.data.action === "bitmaps") {
      const { bitmaps } = event.data.payload;
      bitmapsConfig[0].ctx.transferFromImageBitmap(bitmaps[0]);
      bitmapsConfig[1].ctx.transferFromImageBitmap(bitmaps[1]);
    }
    const li = makeLi({
      text: `[${NAME} <-- shared worker] - ${e.data.action}`,
      style: styleFromWorker,
    });
    messages.appendChild(li);
    messages.lastChild.scrollIntoView();
  };
})();
