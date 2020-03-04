/**
 * Toggle display of the navbar dropdown for small screens.
 */
export function toggleMobileNav() {
  const nav = document.querySelector("nav");
  nav.classList.toggle("nav-grid--expanded");
}
