// Actions sent by main thread to the web worker
export const MainThreadAction = Object.freeze({
  INIT_WORKER_STATE: "initialize-worker-state",
  REQUEST_BITMAPS: "request-bitmaps",
  START_RENDER_LOOP: "start-render-loop",
  STOP_RENDER_LOOP: "stop-render-loop",
});

// Actions sent by the web worker to the main thread
export const WorkerAction = Object.freeze({
  BITMAPS: "bitmaps",
  NOTIFY: "notify",
  TERMINATE_ME: "terminate-me",
});
