import { Application } from "./application";
import { toggleMobileNav } from "./components/navbar";
import "../css/index.css";

window.toggleMobileNav = toggleMobileNav;

(function iife() {
  console.log("iife -> window.toggleMobileNav", toggleMobileNav);
  new Application();
})();
