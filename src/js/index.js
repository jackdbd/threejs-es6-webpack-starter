import { Application } from "./application";

import "../css/index.css";

// wrap everything inside a function scope and invoke it (IIFE, a.k.a. SEAF)
(() => {
  const containers = document.getElementsByClassName("canvas-container");
  let app = null;
  if (containers.length === 0) {
    app = new Application({ showHelpers: true });
  } else if (containers.length === 1) {
    app = new Application({
      container: containers[0],
      showHelpers: true,
    });
  } else {
    alert("Too many <div class='canvas-container' /> elements in your HTML");
  }
  console.log("Application instance", app);
})();

// Note: neither app nor containers are defined here because they were available
// only in function scope, so we don't pollute the global namespace.
