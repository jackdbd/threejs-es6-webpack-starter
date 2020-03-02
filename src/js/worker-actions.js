// Actions sent by main thread to the web worker
export const MainThreadAction = Object.freeze({
  INIT_WORKER_STATE: "initialize-worker-state",
  REQUEST_BITMAPS: "request-bitmaps",
});

// Actions sent by the web worker to the main thread
export const BitmapWorkerAction = Object.freeze({
  BITMAPS: "bitmaps",
  NOTIFY: "notify",
  TERMINATE_ME: "terminate-me",
});
