const path = require("path");

/**
 * Transformer for `.glsl` files.
 *
 * A jest transformer is a module that provides a synchronous function for
 * transforming source files.
 * In jest tests we don't use the original `.glsl` files used in the app (like
 * we don't any other static asset such as `css` stylesheets and `png` images).
 *
 * To recap, in order to handle any static asset in jest we have two options:
 *
 * 1) mock the original file by providing a file stub (specified in the
 * `moduleNameMapper` config option);
 * 2) mock the original file by transforming it using a trasformer (specified in
 * the `transform` config option).
 *
 * @see https://jestjs.io/docs/en/configuration#transform-object-string-pathtotransformer-pathtotransformer-object
 */
const transformer = {
  process(src, filename, jestConfig, options) {
    const baseFilename = JSON.stringify(path.basename(filename));
    const msg = `${baseFilename} was transformed because it matched a file pattern specified in jest config transform and jest automock was set to ${jestConfig.automock}.`;
    console.log(msg);
    return `module.exports = ${baseFilename};`;
  },
};

module.exports = transformer;
