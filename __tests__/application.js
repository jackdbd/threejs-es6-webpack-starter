import Application from "../src/js/application";

describe("DOM", () => {
  afterEach(() => {
    // Remove all body's children to make sure the tests are independent
    const body = document.querySelector("body");
    while (body.firstChild) {
      body.removeChild(body.firstChild);
    }
  });
  it("starts with an empty <body>", () => {
    expect(document.querySelector("body")).toBeEmpty();
    expect(document.querySelector(".container")).not.toBeInTheDocument();
  });
  it("appends a <div> container in the DOM when creating the app", () => {
    new Application();
    const body = document.querySelector("body");
    expect(body.firstElementChild).toHaveClass("container");
    expect(document.querySelector("#canvas-container")).toBeInTheDocument();
  });
  it("uses the provided <div> container without creating a new one", () => {
    const div = document.createElement("div");
    const customId = "pre-existing-canvas-container";
    const customClass = "pre-existing-container";
    div.setAttribute("id", customId);
    div.setAttribute("class", customClass);
    document.body.appendChild(div);
    new Application({ container: div });
    const body = document.querySelector("body");
    expect(body.firstElementChild).toHaveClass(customClass);
    expect(document.querySelector(`#${customId}`)).toBeInTheDocument();
    expect(document.querySelector("#canvas-container")).not.toBeInTheDocument();
    expect(body.childElementCount).toBe(1);
  });
  it("creates a visible <div> container", () => {
    new Application();
    const body = document.querySelector("body");
    expect(body.firstElementChild).toBeVisible();
  });
  it("shows an error message when WebGL is not supported", () => {
    new Application();
    const el = document.querySelector("div.container").firstElementChild;
    expect(el.id).toBe("webgl-error-message");
    const message =
      "Your browser does not seem to support WebGL. Find out how to get it here.";
    expect(el).toHaveTextContent(message);
  });
});
