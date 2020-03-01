const path = require("path");
const CircularDependencyPlugin = require("circular-dependency-plugin");
const { DefinePlugin } = require("webpack");
const DuplicatePackageCheckerPlugin = require("duplicate-package-checker-webpack-plugin");
const FaviconsWebpackPlugin = require("favicons-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");

const APP_NAME = "Three.js ES6 Webpack 4 Project Starter";

const rules = [
  // Rule for web workers
  {
    test: /\.js$/,
    include: [path.join(__dirname, "src", "js", "workers")],
    exclude: [path.join(__dirname, "node_modules")],
    use: [
      {
        loader: "worker-loader",
        options: {
          name: path.join("workers", "[name].[hash].js"),
        },
      },
    ],
  },
  // Rule for JS files (not web workers)
  {
    test: /\.(js|jsx)$/,
    include: [path.join(__dirname, "src", "js")],
    exclude: [
      path.join(__dirname, "node_modules"),
      path.join(__dirname, "src", "js", "workers"),
    ],
    use: {
      loader: "babel-loader",
    },
  },
  // Rule for stylesheets
  {
    test: /\.(css)$/,
    include: [path.join(__dirname, "src", "css")],
    use: [
      MiniCssExtractPlugin.loader,
      {
        loader: "css-loader",
        options: {
          // avoid using CSS modules
          modules: false,
          sourceMap: true,
        },
      },
    ],
  },
  // Rule for shaders
  {
    test: /\.glsl$/,
    use: [
      {
        loader: "webpack-glsl-loader",
      },
    ],
  },
  // Rule for .ttf font files
  {
    test: /\.(ttf)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
    include: [path.join(__dirname, "src", "fonts")],
    use: {
      loader: "file-loader",
      options: {
        name: path.join("fonts", "[name].[ext]"),
      },
    },
  },
  // Rule for textures (images)
  {
    test: /.(jpe?g|png)$/i,
    include: path.join(__dirname, "src", "textures"),
    loaders: [
      {
        loader: "file-loader",
        options: {
          name: path.join("textures", "[name].[hash].[ext]"),
        },
      },
      {
        loader: "image-webpack-loader",
        query: {
          gifsicle: {
            interlaced: false,
          },
          mozjpeg: {
            progressive: true,
            quality: 85,
          },
          pngquant: {
            quality: [0.65, 0.9],
            speed: 4,
          },
        },
      },
    ],
  },
];

/**
 * Webpack config shared between development and production environments.
 */
const commonConfigFn = (env = {}, argv = {}) => {
  if (!env.hasOwnProperty("publicUrl")) {
    throw new Error("env must have the `publicUrl` property");
  }
  if (!argv.hasOwnProperty("mode")) {
    throw new Error(
      "argv must have the `mode` property ('development' or 'production')"
    );
  }
  console.log(`Prepare ${argv.mode.toUpperCase()} build`);

  const plugins = [
    new CircularDependencyPlugin({
      exclude: /node_modules/,
      failOnError: true,
    }),
    new DefinePlugin({
      APP_NAME: JSON.stringify(APP_NAME),
    }),
    new DuplicatePackageCheckerPlugin({
      emitError: false,
      showHelp: true,
      strict: false,
      verbose: true,
    }),
    new HtmlWebpackPlugin({
      chunks: ["home"],
      filename: "index.html",
      hash: true,
      template: path.join(__dirname, "src", "templates", "index.html"),
      templateParameters: {
        APP_NAME,
        PUBLIC_URL: env.publicUrl,
      },
    }),
    new HtmlWebpackPlugin({
      chunks: ["bitmap-demo"],
      filename: "bitmap-canvas-demo.html",
      hash: true,
      template: path.join(
        __dirname,
        "src",
        "templates",
        "bitmap-canvas-demo.html"
      ),
      templateParameters: {
        PUBLIC_URL: env.publicUrl,
      },
    }),
    new HtmlWebpackPlugin({
      chunks: ["about"],
      filename: "about.html",
      hash: true,
      template: path.join(__dirname, "src", "templates", "about.html"),
      templateParameters: {
        PUBLIC_URL: env.publicUrl,
      },
    }),
    // html-webpack-plugin must come BEFORE favicons-webpack-plugin in the
    // plugins array.
    // https://github.com/jantimon/favicons-webpack-plugin#html-injection
    new FaviconsWebpackPlugin({
      inject: true,
      logo: path.join(__dirname, "src", "textures", "star.png"),
      title: APP_NAME,
    }),
    new MiniCssExtractPlugin({
      filename: "[name].[hash].css",
      chunkFilename: "[id].bundle.css",
    }),
  ];

  const config = {
    context: __dirname,
    entry: {
      about: path.resolve(__dirname, "src", "js", "about.js"),
      "bitmap-demo": path.resolve(__dirname, "src", "js", "bitmap-demo.js"),
      home: path.resolve(__dirname, "src", "js", "index.js"),
    },
    mode: argv.mode,
    module: {
      rules,
    },
    output: {
      filename: "[name].[hash].js",
      path: path.join(__dirname, "build"),
      publicPath: "/",
      sourceMapFilename: "[file].[hash].map",
    },
    plugins,
    performance: {
      assetFilter: assetFilename => {
        // Silence warnings for big source maps (default) and font files.
        // To reduce .ttf file size, check the link below.
        // https://www.cnx-software.com/2010/02/19/reducing-truetype-font-file-size-for-embedded-systems/
        return !/\.map$/.test(assetFilename) && !assetFilename.endsWith(".ttf");
      },
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
        three: path.resolve(__dirname, "node_modules", "three"),
      },
      extensions: [".js"],
    },
    target: "web",
  };

  // console.log("=== Webpack config ===", config);
  const smp = new SpeedMeasurePlugin({
    // granularLoaderData: true,
  });

  return smp.wrap(config);
};

module.exports = {
  commonConfigFn,
};
