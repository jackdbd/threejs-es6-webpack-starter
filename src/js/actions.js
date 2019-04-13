// Actions sent by main thread to the web worker
const mainToWorker = "[main --> worker]";
export const INIT = `${mainToWorker} INIT`;

// Actions sent by the web worker to the main thread
const workerToMain = "[main <-- worker]";
export const KILL_ME = `${workerToMain} KILLME`;
export const NOTIFY = `${workerToMain} NOTIFY`;
export const BITMAP = `${workerToMain} BITMAP`;
