import { Application } from "../src/js/application";

const prepareDOM = () => {
  const main = document.createElement("main");
  const figure = document.createElement("figure");
  const outerDiv = document.createElement("div");
  outerDiv.classList.add("canvas-container-outer");
  const innerDiv = document.createElement("div");
  innerDiv.setAttribute("class", "canvas-container-inner");
  outerDiv.appendChild(innerDiv);
  figure.appendChild(outerDiv);
  main.appendChild(figure);
  document.body.appendChild(main);
};

describe("Three.js application", () => {
  let windowAlert;

  beforeAll(() => {
    // alert is not available in Jest DOM, so we provide a mock implementation.
    windowAlert = jest.spyOn(window, "alert");
    windowAlert.mockImplementation(() => {});
  });

  beforeEach(() => {
    prepareDOM();
  });

  afterEach(() => {
    windowAlert.mockReset();
    // Remove all body's children to make sure the tests are independent
    const body = document.querySelector("body");
    while (body.firstChild) {
      body.removeChild(body.firstChild);
    }
  });

  it("shows an error message when WebGL is not supported", () => {
    new Application();
    const container = document.querySelector("main .canvas-container-inner");
    const el = container.firstChild;
    expect(el.id).toBe("webgl-error-message");
    const message =
      "Your browser does not seem to support WebGL. Find out how to get it here.";
    expect(el).toHaveTextContent(message);
  });
});
