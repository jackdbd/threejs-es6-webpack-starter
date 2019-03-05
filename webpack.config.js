const path = require("path");
const webpack = require("webpack");

const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
  .BundleAnalyzerPlugin;
const CleanWebpackPlugin = require("clean-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const DuplicatePackageCheckerPlugin = require("duplicate-package-checker-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const PacktrackerPlugin = require("@packtracker/webpack-plugin");

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
    colors: true,
    reasons: true,
    chunks: false,
    modules: false,
  },
};

module.exports = (env, argv) => {
  console.log(`Prepare ${argv.mode.toUpperCase()} build`);
  const isProduction = argv.mode === "production";

  const plugins = [
    new BundleAnalyzerPlugin({
      analyzerMode: "disabled",
      generateStatsFile: true,
    }),
    new CleanWebpackPlugin(["build"], {
      root: __dirname,
      exclude: ["favicon.ico"],
      verbose: true,
    }),
    new DuplicatePackageCheckerPlugin({
      emitError: false,
      showHelp: true,
      strict: false,
      verbose: true,
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "templates", "index.html"),
      hash: true,
      filename: "index.html",
      chunks: ["commons", "home"],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "templates", "about.html"),
      hash: true,
      filename: "about.html",
      chunks: ["commons", "about"],
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
    target: "web",
    entry: {
      about: ["./src/js/about.js"],
      home: ["./src/js/index.js"],
    },
    output: {
      path: path.join(__dirname, "build"),
      filename: "[hash].js",
      chunkFilename: "[id].bundle.js",
    },
    devtool: isProduction ? "source-map" : "cheap-source-map",
    module: {
      rules,
    },
    optimization,
    plugins,
    devServer,
    performance: {
      hints: "warning",
    },
  };
  return config;
};
