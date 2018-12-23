import Application from "./application";

// wrap everything inside a function scope and invoke it (IIFE, a.k.a. SEAF)
(() => {
  const app = new Application({
    container: document.getElementById("canvas-container"),
  });
  console.log(app);
})();
