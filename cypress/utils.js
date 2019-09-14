export const dragFromTo = (selector, fromPos, toPos) => {
  const [x0, y0] = fromPos;
  const [x1, y1] = toPos;
  cy.get(selector)
    .trigger("mousedown", { button: 0, buttons: 1, clientX: x0, clientY: y0 })
    .trigger("mousemove", { button: 0, buttons: 1, clientX: x1, clientY: y1 })
    .trigger("mouseup", { button: 0, buttons: 0 });
};

export const zoomInAt = (selector, pos, numZoomEvents) => {
  const [x, y] = pos;
  const options = {
    clientX: x,
    clientY: y,
    deltaX: 0,
    deltaY: -53,
    deltaZ: 0,
    deltaMode: 0,
  };

  Array(numZoomEvents)
    .fill("wheel")
    .forEach(eventName => {
      cy.get(selector).trigger(eventName, options);
    });
  // coordsHistory must be at least 2 sets of coords
  cy.get(selector).click();
};
