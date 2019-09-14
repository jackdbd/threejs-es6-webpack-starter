const config = {
  automock: false,
  collectCoverage: true,
  collectCoverageFrom: ["<rootDir>/src/js/*.{js,ts}"],
  coverageDirectory: "<rootDir>/coverage/",
  /*
   * Configure Jest to provide stubs for static assets such as stylesheets and
   * images. Usually, these files aren't particularly useful in tests so we can
   * mock them out.
   */
  moduleNameMapper: {
    "\\.(jpg|jpeg|png)$": "<rootDir>/__mocks__/fileMock.js",
    "\\.(css)$": "<rootDir>/__mocks__/styleMock.js",
  },
  modulePathIgnorePatterns: [
    "<rootDir>/build/",
    "<rootDir>/coverage/",
    "<rootDir>/node_modules/",
  ],
  runner: "jest-runner",
  // Setup files to run immediately before executing the test code.
  setupFiles: [],
  /**
   * Setup files to run immediately after the test framework has been installed
   * in the environment.
   */
  setupFilesAfterEnv: ["<rootDir>/setupJestDomTests.js"],
  testEnvironment: "jsdom",
  testURL: "http://localhost",
  testRegex: "__tests__/.*\\.(js|ts)$",
  transform: {
    "^.+\\.[t|j]sx?$": "babel-jest",
    "\\.(glsl)$": "<rootDir>/glslTransformer.js",
  },
  transformIgnorePatterns: ["[/\\\\]node_modules[/\\\\].+\\.(js|ts)$"],
  watchPlugins: [],
};

module.exports = config;
