const config = {
  collectCoverage: true,
  collectCoverageFrom: ["src/js/*.{js,ts}"],
  coverageDirectory: "./coverage/",
  /*
   * Configure Jest to gracefully handle asset files such as stylesheets and
   * images. Usually, these files aren't particularly useful in tests so we can
   * safely mock them out.
   * TODO: check what to do with glsl files (can I mock them?)
   */
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|glsl)$": "<rootDir>/__mocks__/fileMock.js",
    "\\.(css)$": "<rootDir>/__mocks__/styleMock.js",
  },
  modulePathIgnorePatterns: ["/build/", "/node_modules/"],
  setupFilesAfterEnv: ["<rootDir>/setupJestDomTests.js"],
  testEnvironment: "jsdom",
  testURL: "http://localhost",
  testRegex: "__tests__/.*\\.(js|ts)$",
  transform: {
    ".+\\.js": "babel-jest",
  },
  transformIgnorePatterns: ["[/\\\\]node_modules[/\\\\].+\\.(js|ts)$"],
};

module.exports = config;
