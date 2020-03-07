const path = require("path");
const merge = require("webpack-merge");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const ManifestPlugin = require("webpack-manifest-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const PacktrackerPlugin = require("@packtracker/webpack-plugin");
const { ProgressPlugin } = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");

const { commonConfigFn } = require("./webpack.common");

const optimization = {
  minimizer: [
    // Minify JS
    new TerserPlugin({
      // Enable file caching (doesn't work with webpack 5)
      cache: true,
      extractComments: true,
      // Use multi-process parallel running (speeds up the build)
      parallel: true,
      // Use source maps to map error message locations to modules (slows down the build)
      sourceMap: true,
    }),
    // Minify CSS. Strangely enough, I need to re-instantiate this plugin in the
    // plugins section.
    // optimize-css-assets-webpack-plugin uses cssnano as css processor
    new OptimizeCSSAssetsPlugin({
      cssProcessor: require("cssnano"),
      // https://cssnano.co/optimisations/
      cssProcessorPluginOptions: {
        preset: ["default", { discardComments: { removeAll: true } }],
      },
    }),
  ],
  // https://webpack.js.org/configuration/optimization/#optimizationmoduleids
  // moduleIds: "hashed",
  // Creates a single chunk that contains the Webpack's runtime and it is shared
  // among all generated chunks.
  // https://webpack.js.org/configuration/optimization/#optimizationruntimechunk
  runtimeChunk: "single",
  // Configuration for SplitChunksPlugin (webpack internal plugin).
  // https://webpack.js.org/plugins/split-chunks-plugin/#split-chunks-example-2
  splitChunks: {
    cacheGroups: {
      // Do not enforce the creation of the chunks belonging to the `commons`
      // cacheGroup, but create a chunk for this cachGroup only if it is shared
      // by 2+ chunks, no matter how small this chunk is.
      // https://webpack.js.org/plugins/split-chunks-plugin/#splitchunksminsize
      commons: {
        minChunks: 2,
        minSize: 0,
        // https://webpack.js.org/plugins/split-chunks-plugin/#splitchunksname
        name: "commons",
        priority: 0,
        // It would be cool to indicate in this chunk's name the name of the
        // chunks where it is used, but this would make the configuration of
        // HtmlWebpackPlugin more tedious and hard to maintain.
        // name(module, chunks, cacheGroupKey) {
        //   const moduleFileName = module
        //     .identifier()
        //     .split("/")
        //     .reduceRight(item => item);
        //   const allChunksNames = chunks.map(item => item.name).join("~");
        //   return `${cacheGroupKey}-[${allChunksNames}]-${moduleFileName}`;
        // },
        test: /\.js$/,
      },
      // Most of the pages use the same stylesheets, so enforce the creation of
      // a single chunk for all CSS files.
      // https://webpack.js.org/plugins/mini-css-extract-plugin/#extracting-all-css-in-a-single-file
      styles: {
        enforce: true,
        name: "styles",
        priority: 10,
        test: /\.css$/,
      },
      // Enforce the creation of a single chunk for vendor code (vendor), so
      // it's easier to visually inspect how big our dependencies are (e.g. by
      // using webpack-bundle-analyzer).
      vendor: {
        enforce: true,
        name: "vendor",
        priority: 20,
        // test: /[\\/]node_modules[\\/]/,
        test(module, chunks) {
          // `module.resource` contains the absolute path of the file on disk.
          // Note the usage of `path.sep` instead of / or \, for cross-platform
          // compatibility.
          // console.log("=== module.resource ===", module.resource);
          return (
            module.resource &&
            module.resource.endsWith(".js") &&
            (module.resource.includes(`${path.sep}node_modules${path.sep}`) ||
              module.resource.includes("vendor"))
          );
        },
      },
    },
    // Include all types of chunks (async and non-async chunks).
    // https://webpack.js.org/plugins/split-chunks-plugin/#splitchunkschunks
    chunks: "all",
    // It is recommended to set splitChunks.name to false for production builds
    // so that it doesn't change names unnecessarily.
    name: false,
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
    new OptimizeCSSAssetsPlugin({
      cssProcessor: require("cssnano"),
      cssProcessorPluginOptions: {
        preset: ["default", { discardComments: { removeAll: true } }],
      },
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
    new ManifestPlugin(),
  ];

  const finalWebpackConfig = merge(commonConfigFn(prodEnv, prodArgv), {
    devtool: "source-map",
    mode: prodArgv.mode,
    optimization,
    plugins,
  });
  // console.log("=== finalWebpackConfig ===", finalWebpackConfig.plugins[8]);
  return finalWebpackConfig;
};
