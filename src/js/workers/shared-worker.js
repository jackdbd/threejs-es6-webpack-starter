// This is a shared web worker, so `self` is a SharedWorkerGlobalScope.
// https://developer.mozilla.org/en-US/docs/Web/API/SharedWorkerGlobalScope
// TODO: how to import dependencies?

// This is a web worker, so here we are in a SharedWorkerGlobalScope.
// There is no `window`, and if we try to access it the shared web worker dies
// without signaling the main thread about any errors. So never do this:
// console.log("WINDOW", window);

// console.log is available in the SharedWorkerGlobalScope execution context,
// but it gets printed only in Firefox, not in Chrome.
const isConsoleLogAvailable = !!self.console.log;
// So this does nothing (but does not cause any failure). I like to leave it
// here because it's an effective way to understand if you loaded the web worker
// in the correct execution context. If you see Window you loaded the script in
// the main thread. If you see DedicatedWorkerGLobalScope you loaded it as a
// dedicated web worker. Only if you see nothing, then you loaded it correctly.
// console.log("SELF", self);

const WorkerAction = Object.freeze({
  BITMAPS: "bitmaps",
  CONNECTION: "connection",
  INIT_SHARED_WORKER: "init-shared-worker",
  NOTIFY: "notify",
  TERMINATE_ME: "terminate-me",
  UNHANDLED_MESSAGE: "unhandled-message",
});

// https://developer.mozilla.org/en-US/docs/Web/API/SharedWorkerGlobalScope/onconnect
onconnect = function(messageEvent) {
  console.log(
    "=== ON CONNECT EVENT ===",
    messageEvent.data,
    messageEvent.origin,
    messageEvent.lastEventId,
    messageEvent.returnValue,
    messageEvent.timeStamp,
    messageEvent.type
  );
  const numConnections = messageEvent.ports.length;
  const port = messageEvent.ports[0];
  // create the shared web worker with new SharedWorker("some-url", "some-name");
  // and not with new SharedWorker("some-url", { name: "some-name" })
  // If you use the latter, self.name will be "[object Object]".
  const source = self.name;

  port.postMessage({
    action: WorkerAction.CONNECTION,
    payload: {
      info: `connection established with shared web worker ${self.name}`,
      numConnections,
    },
    source,
  });

  port.onmessage = function(event) {
    console.log(
      "=== onmessage.event ===",
      event,
      event.origin,
      event.timeStamp,
      event.lastEventId,
      event.type
    );

    switch (event.data.action) {
      case WorkerAction.INIT: {
        port.postMessage({
          action: "ANSWER_FROM_SHARED_WORKER",
          source,
        });
        break;
      }
      case "FOO": {
        port.postMessage({
          action: "ANSWER_FROM_SHARED_WORKER",
          payload: {
            answer: "bar",
            // isConsoleLogAvailable,
          },
          source,
        });
        break;
      }
      case "GIVE_BITMAPS": {
        port.postMessage({
          action: WorkerAction.NOTIFY,
          payload: { info: `working on it...` },
          source,
        });
        // do work
        const buffer = new ArrayBuffer(8);
        const width = 1024;
        const height = 768;

        // to detect if OffscreenCanvas is available (it's not available in Firefox)
        // "OffscreenCanvas" in self

        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext("2d");
        // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Compositing
        // ctx.globalCompositeOperation = "copy";
        // ctx.globalCompositeOperation = "difference";
        // ctx.globalCompositeOperation = "overlay";
        ctx.globalCompositeOperation = "xor";
        ctx.fillStyle = "rgb(200, 0, 0)";
        ctx.fillRect(50, 50, width / 2, height / 2);
        ctx.fillStyle = "rgb(0, 0, 255)";
        ctx.fillRect(width / 2, height / 2, 200, 200);
        const bitmap1 = ctx.canvas.transferToImageBitmap();

        // const arr = new Uint8ClampedArray(width * height * 4);
        // const imageData = new ImageData(arr, width, height);
        const imageData = new ImageData(width, height);
        const half = imageData.data.length / 2;
        // Iterate through the top 1/2 of the image, every pixel
        for (let i = 0; i < half; i += 4) {
          // Modify pixel data
          imageData.data[i + 0] = 190; // R value
          imageData.data[i + 1] = 0; // G value
          imageData.data[i + 2] = 210; // B value
          imageData.data[i + 3] = 155; // A value
        }
        // Iterate through the bottom 1/2 of the image, every pixel
        for (let i = half; i < imageData.data.length; i += 4) {
          imageData.data[i + 0] = 0; // R value
          imageData.data[i + 1] = 255; // G value
          imageData.data[i + 2] = 0; // B value
          imageData.data[i + 3] = 255; // A value
        }

        createImageBitmap(imageData).then(bitmap => {
          // const bitmaps = [bitmap, bitmap1, buffer];
          port.postMessage(
            {
              action: WorkerAction.BITMAPS,
              payload: {
                info: `bitmaps transferred of ownership`,
                bitmaps: [bitmap, bitmap1, buffer],
              },
              source,
            },
            [bitmap, bitmap1, buffer]
          );
        });
        break;
      }
      default: {
        port.postMessage({
          action: WorkerAction.UNHANDLED_MESSAGE,
          source,
        });
      }
    }
  };
};
