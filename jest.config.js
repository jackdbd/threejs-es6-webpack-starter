const config = {
  /*
   * Configure Jest to gracefully handle asset files such as stylesheets and
   * images. Usually, these files aren't particularly useful in tests so we can
   * safely mock them out.
   * TODO: check what to do with glsl files (can I mock them?)
   */
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|glsl)$": "<rootDir>/__mocks__/fileMock.js",
    "\\.(css|sass)$": "<rootDir>/__mocks__/styleMock.js",
  },
  modulePathIgnorePatterns: ["/build/", "/node_modules/"],
  setupTestFrameworkScriptFile: "<rootDir>/setupJestDomTests.js",
  testRegex: "/__tests__/.*\\.js$",
  transform: {
    ".+\\.js": "babel-jest",
  },
};

module.exports = config;
