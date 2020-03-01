const merge = require("webpack-merge");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const PacktrackerPlugin = require("@packtracker/webpack-plugin");
const { ProgressPlugin } = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");

const { commonConfigFn } = require("./webpack.common");

const optimization = {
  minimizer: [
    new TerserPlugin({
      // Enable file caching
      cache: true,
      // Use multi-process parallel running (speeds up the build)
      parallel: true,
      // Use source maps to map error message locations to modules (slows down the build)
      sourceMap: true,
    }),
  ],
  splitChunks: {
    automaticNameDelimiter: "~",
    cacheGroups: {
      default: {
        minChunks: 2,
        priority: -20,
        reuseExistingChunk: true,
      },
      vendors: {
        priority: -10,
        test: /[\\/]node_modules[\\/]/,
      },
    },
    chunks: "async",
    maxAsyncRequests: 5,
    maxInitialRequests: 3,
    maxSize: 0,
    minChunks: 1,
    minSize: 30000,
    name: true,
  },
};

module.exports = (env = {}, argv = {}) => {
  const prodEnv = Object.assign(env, {
    publicUrl: "https://jackdbd.github.io/threejs-es6-webpack-starter",
  });
  const prodArgv = Object.assign(argv, { mode: "production" });

  const plugins = [
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: true,
      verbose: true,
    }),
    new CompressionPlugin({
      algorithm: "gzip",
      filename: "[path].gz[query]",
      test: /\.(css|html|js|svg|ttf)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),
    new CompressionPlugin({
      algorithm: "brotliCompress",
      compressionOptions: { level: 11 },
      filename: "[path].br[query]",
      test: /\.(css|html|js|svg|ttf)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),
    new ProgressPlugin({
      activeModules: true,
      profile: true,
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: "disabled",
      generateStatsFile: true,
      statsFilename: "stats.json",
    }),
    new PacktrackerPlugin({
      // https://docs.packtracker.io/faq#why-cant-the-plugin-determine-my-branch-name
      branch: process.env.TRAVIS_BRANCH,
      fail_build: true,
      project_token: "2464bed1-d810-4af6-a615-877420f902b2",
      // upload stats.json only in CI
      upload: process.env.CI === "true",
    }),
  ];

  return merge(commonConfigFn(prodEnv, prodArgv), {
    devtool: "source-map",
    mode: prodArgv.mode,
    optimization,
    plugins,
  });
};
