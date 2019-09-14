export const dragFromTo = (selector, fromPos, toPos) => {
  const [x0, y0] = fromPos;
  const [x1, y1] = toPos;
  cy.get(selector)
    .trigger("mousedown", { button: 0, buttons: 1, clientX: x0, clientY: y0 })
    .trigger("mousemove", { button: 0, buttons: 1, clientX: x1, clientY: y1 })
    .trigger("mouseup", { button: 0, buttons: 0 });
};
