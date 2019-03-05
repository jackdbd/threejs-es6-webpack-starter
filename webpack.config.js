const path = require("path");
const webpack = require("webpack");

const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
  .BundleAnalyzerPlugin;
const CleanWebpackPlugin = require("clean-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const DuplicatePackageCheckerPlugin = require("duplicate-package-checker-webpack-plugin");
const FaviconsWebpackPlugin = require("favicons-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const PacktrackerPlugin = require("@packtracker/webpack-plugin");

const APP_NAME = "Three.js ES6 Webpack 4 Project Starter";

const rules = [
  {
    test: /\.(js|jsx)$/,
    include: [path.join(__dirname, "src", "js")],
    exclude: [path.join(__dirname, "node_modules")],
    use: {
      loader: "babel-loader",
    },
  },
  {
    test: /\.(css)$/,
    include: [path.join(__dirname, "src", "css")],
    use: [
      MiniCssExtractPlugin.loader,
      {
        loader: "css-loader",
        options: {
          modules: false, // avoid using CSS modules
          sourceMap: true,
        },
      },
    ],
  },
  // rule for shaders
  {
    test: /\.glsl$/,
    use: [
      {
        loader: "webpack-glsl-loader",
      },
    ],
  },
  // rule for .ttf font files
  {
    test: /\.(ttf)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
    use: {
      loader: "file-loader",
      options: {
        name: "./fonts/[name].[ext]",
      },
    },
  },
  // rule for textures (images)
  {
    test: /\.(jpe?g|png)$/i,
    include: path.join(__dirname, "src", "textures"),
    loaders: [
      "file-loader",
      {
        loader: "image-webpack-loader",
        query: {
          gifsicle: {
            interlaced: false,
          },
          mozjpeg: {
            progressive: true,
            quality: 65,
          },
          pngquant: {
            quality: "65-90",
            speed: 4,
          },
        },
      },
    ],
  },
];

const optimization = {
  splitChunks: {
    cacheGroups: {
      js: {
        test: /\.js$/,
        name: "commons",
        chunks: "all",
        minChunks: 7,
      },
      css: {
        test: /\.(css)$/,
        name: "commons",
        chunks: "all",
        minChunks: 2,
      },
    },
  },
};

const devServer = {
  compress: true,
  contentBase: path.join(__dirname, "build"),
  host: "localhost",
  inline: true,
  port: 8080,
  stats: {
    chunks: false,
    colors: true,
    modules: false,
    reasons: true,
  },
};

module.exports = (env, argv) => {
  console.log(`Prepare ${argv.mode.toUpperCase()} build`);
  const isProduction = argv.mode === "production";
  const PUBLIC_URL = isProduction
    ? "https://jackdbd.github.io/threejs-es6-webpack-starter"
    : "";

  const plugins = [
    new BundleAnalyzerPlugin({
      analyzerMode: "disabled",
      generateStatsFile: true,
    }),
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: true,
      verbose: true,
    }),
    new webpack.DefinePlugin({
      APP_NAME: JSON.stringify(APP_NAME),
    }),
    new DuplicatePackageCheckerPlugin({
      emitError: false,
      showHelp: true,
      strict: false,
      verbose: true,
    }),
    new FaviconsWebpackPlugin({
      inject: true,
      logo: path.join(__dirname, "src", "textures", "star.png"),
      title: APP_NAME,
    }),
    new HtmlWebpackPlugin({
      chunks: ["homePage"],
      filename: "index.html",
      hash: true,
      template: path.join(__dirname, "src", "templates", "index.html"),
      templateParameters: {
        APP_NAME,
        PUBLIC_URL,
      },
    }),
    new HtmlWebpackPlugin({
      chunks: ["aboutPage"],
      filename: "about.html",
      hash: true,
      template: path.join(__dirname, "src", "templates", "about.html"),
      templateParameters: {
        PUBLIC_URL,
      },
    }),
    new MiniCssExtractPlugin({
      filename: "[hash].css",
      chunkFilename: "[id].bundle.css",
    }),
    new PacktrackerPlugin({
      branch: process.env.TRAVIS_BRANCH, // https://docs.packtracker.io/faq#why-cant-the-plugin-determine-my-branch-name
      fail_build: true,
      project_token: "2464bed1-d810-4af6-a615-877420f902b2",
      upload: process.env.CI === "true", // upload stats.json only in CI
    }),
  ];

  if (isProduction) {
    plugins.push(
      new CompressionPlugin({
        algorithm: "gzip",
        test: /\.(js|html)$/,
        threshold: 10240,
        minRatio: 0.8,
      })
    );
  } else {
    plugins.push(new webpack.HotModuleReplacementPlugin());
  }

  const config = {
    context: __dirname,
    devServer,
    devtool: isProduction ? "source-map" : "cheap-source-map",
    entry: {
      aboutPage: "./src/js/about.js",
      homePage: "./src/js/index.js",
    },
    module: {
      rules,
    },
    optimization,
    // output: {
    //   chunkFilename: "[id].bundle.js",
    //   filename: "[hash].js",
    //   path: path.join(__dirname, "build"),
    // },
    output: {
      filename: "[name].[hash].js",
      path: path.join(__dirname, "build"),
    },
    plugins,
    performance: {
      hints: "warning",
    },
    resolve: {
      alias: {
        // orbit-controls-es6 declares a version of three different from the one
        // used by this application. This would cause three to be duplicated in
        // the bundle. One way to avoid this issue is to use resolve.alias.
        // With resolve.alias we are telling Webpack to route any package
        // references to a single specified path.
        // Note: Aliasing packages with different major versions may break your
        // app. Use only if you're sure that all required versions are
        // compatible, at least in the context of your app
        // https://github.com/darrenscerri/duplicate-package-checker-webpack-plugin#resolving-duplicate-packages-in-your-bundle
        three: path.resolve(__dirname, "node_modules/three"),
      },
    },
    target: "web",
  };
  return config;
};
