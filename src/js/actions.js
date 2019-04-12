// Actions sent from by main thread to the web worker
export const INIT = "[main --> worker] INIT";

// Actions sent by the web worker to the main thread
export const KILL_ME = "[main <-- worker] KILLME";
export const NOTIFY = "[main <-- worker] NOTIFY";
