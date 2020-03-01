import { Application } from "./application";
import "../css/index.css";

(function iife() {
  const containers = document.getElementsByClassName("canvas-container");
  // console.log("containers", containers);
  const canvas = document.querySelector("#application-canvas");
  // console.log("canvas", canvas);

  let app = null;
  if (containers.length === 0) {
    app = new Application({ showHelpers: true, canvas });
  } else if (containers.length === 1) {
    app = new Application({
      canvas,
      container: containers[0],
      showHelpers: true,
    });
  } else {
    alert("Too many <div class='canvas-container' /> elements in your HTML");
  }
  console.log("Application instance", app);
})();
