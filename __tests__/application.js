import { Application } from "../src/js/application";

describe("Three.js application", () => {
  let windowAlert;

  beforeAll(() => {
    // alert is not available in Jest DOM, so we provide a mock implementation.
    windowAlert = jest.spyOn(window, "alert");
    windowAlert.mockImplementation(() => {});
  });

  beforeEach(() => {
    const div = document.createElement("div");
    div.setAttribute("class", "app");
    document.body.appendChild(div);
  });

  afterEach(() => {
    windowAlert.mockReset();
    // Remove all body's children to make sure the tests are independent
    const body = document.querySelector("body");
    while (body.firstChild) {
      body.removeChild(body.firstChild);
    }
  });

  it("starts with an empty <div class='class' />", () => {
    expect(document.querySelector("body > .app")).toBeEmpty();
    expect(document.querySelector(".canvas-container")).not.toBeInTheDocument();
  });

  it("appends <div class='canvas-container' /> when creating the app", () => {
    new Application();
    const app = document.querySelector("body > .app");
    expect(app.firstElementChild).toHaveClass("canvas-container");
    expect(app.lastElementChild).toHaveClass("tooltip");
    expect(document.querySelector(".canvas-container")).toBeInTheDocument();
  });

  it("uses the provided <div> container without creating a new one", () => {
    const div = document.createElement("div");
    const customClass = "pre-existing-container";
    div.setAttribute("class", customClass);
    const app = document.querySelector(".app");
    app.appendChild(div);
    new Application({ container: div });
    expect(app.firstElementChild).toHaveClass(customClass);
    expect(document.querySelector(`.${customClass}`)).toBeInTheDocument();
    expect(document.querySelector(".canvas-container")).not.toBeInTheDocument();
    expect(document.querySelector(".tooltip")).toBeInTheDocument();
    expect(app.childElementCount).toBe(2);
  });

  it("creates a visible <div>", () => {
    new Application();
    const app = document.querySelector(".app");
    expect(app.firstElementChild).toBeVisible();
  });

  it("shows an error message when WebGL is not supported", () => {
    new Application();
    const container = document.querySelector(".app > .canvas-container");
    const el = container.firstChild;
    expect(el.id).toBe("webgl-error-message");
    const message =
      "Your browser does not seem to support WebGL. Find out how to get it here.";
    expect(el).toHaveTextContent(message);
  });
});
