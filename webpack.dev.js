const path = require("path");
const { HotModuleReplacementPlugin } = require("webpack");
const merge = require("webpack-merge");

const { commonConfigFn } = require("./webpack.common");

const devServer = {
  compress: true,
  contentBase: path.join(__dirname, "build"),
  host: "localhost",
  inline: true,
  open: true,
  openPage: "bitmap-canvas-demo.html",
  port: 8080,
  stats: {
    chunks: false,
    colors: true,
    modules: false,
    reasons: true,
  },
};

module.exports = (env = {}, argv = {}) => {
  const devEnv = Object.assign(env, { publicUrl: "" });
  const devArgv = Object.assign(argv, { mode: "development" });

  const plugins = [new HotModuleReplacementPlugin()];

  const finalWebpackConfig = merge(commonConfigFn(devEnv, argv), {
    devServer,
    devtool: "cheap-source-map",
    mode: devArgv.mode,
    plugins,
  });
  // console.log("=== finalWebpackConfig ===", finalWebpackConfig);
  return finalWebpackConfig;
};
