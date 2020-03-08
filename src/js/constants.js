export const ButtonIds = Object.freeze({
  INSTANTIATE_WORKER: "instantiate-worker",
  START_RENDER_LOOP: "start-render-loop",
  STOP_RENDER_LOOP: "stop-render-loop",
  TERMINATE_WORKER: "terminate-worker",
});

export const CanvasIds = Object.freeze({
  BITMAP_LOW_RES: "low-res-bitmap-canvas",
  BITMAP_MEDIUM_RES: "medium-res-bitmap-canvas",
  BITMAP_HIGH_RES: "high-res-bitmap-canvas",
  TRANSFER_CONTROL: "transfer-control-canvas",
});

export const unsupportedOffscreenCanvasAlertMessage = `
Your browser does not support transferControlToOffscreen and OffscreenCanvas.\n
See here:\n
https://caniuse.com/#feat=mdn-api_htmlcanvaselement_transfercontroltooffscreen\n
https://caniuse.com/#feat=offscreencanvas`;
