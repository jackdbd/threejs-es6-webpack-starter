const path = require("path");
const CircularDependencyPlugin = require("circular-dependency-plugin");
const { DefinePlugin } = require("webpack");
const DuplicatePackageCheckerPlugin = require("duplicate-package-checker-webpack-plugin");
const FaviconsWebpackPlugin = require("favicons-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");

// The path used in each rule is resolved starting from `context`.
// GOTCHA: use path.resolve for the path to the source files, and path.join for
// the output files.
const rules = [
  // Rule for html documents and document fragments
  {
    test: /\.html$/,
    include: [path.resolve("src", "html")],
    loader: "html-loader",
    options: {
      // Required to use expressions in HTML documents and fragments.
      // https://webpack.js.org/loaders/html-loader/#interpolate
      interpolate: true,
      minimize: {
        removeComments: true,
      },
    },
  },
  // Rule for web workers
  {
    test: /\.js$/,
    include: [path.resolve("src", "js", "workers")],
    exclude: [path.resolve("node_modules")],
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
    include: [path.resolve("src", "js")],
    exclude: [
      path.resolve("node_modules"),
      path.resolve("src", "js", "workers"),
    ],
    use: {
      loader: "babel-loader",
    },
  },
  // Rule for stylesheets (.sass, .scss, .css)
  {
    test: /\.(sa|sc|c)ss$/,
    include: [path.resolve("src", "css")],
    use: [
      {
        loader: MiniCssExtractPlugin.loader,
        options: {
          // avoid using CSS modules
          modules: false,
          sourceMap: true,
        },
      },
      "css-loader",
      "sass-loader",
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
  // Rule for font files
  {
    test: /\.(ttf|woff|woff2)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
    include: [path.resolve("src", "fonts")],
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
    include: path.resolve("src", "textures"),
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

  const APP_NAME = `Three.js ES6 Webpack 4 Project Starter (${argv.mode})`;
  const PUBLIC_URL = env.publicUrl;

  // In production html-webpack-plugin should automatically minify HTML
  // documents with html-minifier-terser and these parameters, but it doesn't.
  // Setting minify to true also does not work for me; only setting minify as an
  // object does.
  // https://github.com/jantimon/html-webpack-plugin#minification
  const minify =
    argv.mode === "production"
      ? {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true,
        }
      : false;

  const plugins = [
    new CircularDependencyPlugin({
      exclude: /node_modules/,
      failOnError: true,
    }),
    new DefinePlugin({
      APP_NAME: JSON.stringify(APP_NAME),
      PUBLIC_URL: JSON.stringify(PUBLIC_URL),
    }),
    new DuplicatePackageCheckerPlugin({
      emitError: false,
      showHelp: true,
      strict: false,
      verbose: true,
    }),
    new HtmlWebpackPlugin({
      chunks: ["commons", "home", "runtime", "styles", "vendor"],
      filename: "index.html",
      hash: false,
      minify,
      template: path.resolve("src", "html", "documents", "index.html"),
    }),
    new HtmlWebpackPlugin({
      chunks: ["bitmap-demo", "commons", "runtime", "styles", "vendor"],
      filename: "offscreen-bitmaprenderer.html",
      hash: false,
      minify,
      template: path.resolve(
        "src",
        "html",
        "documents",
        "offscreen-bitmaprenderer.html"
      ),
    }),
    new HtmlWebpackPlugin({
      chunks: ["commons", "runtime", "styles", "transfer-demo", "vendor"],
      filename: "offscreen-webgl.html",
      hash: false,
      minify,
      template: path.resolve(
        "src",
        "html",
        "documents",
        "offscreen-webgl.html"
      ),
    }),
    new HtmlWebpackPlugin({
      chunks: ["about", "commons", "runtime", "styles"],
      filename: "about.html",
      hash: false,
      minify,
      template: path.resolve("src", "html", "documents", "about.html"),
    }),
    new HtmlWebpackPlugin({
      chunks: ["404", "commons", "runtime", "styles"],
      filename: "404.html",
      hash: false,
      minify,
      template: path.resolve("src", "html", "documents", "404.html"),
    }),
    // html-webpack-plugin must come BEFORE favicons-webpack-plugin in the
    // plugins array.
    // https://github.com/jantimon/favicons-webpack-plugin#html-injection
    new FaviconsWebpackPlugin({
      // `inject: true` seems not working, so I have a <head> document fragment
      // where I manually reference the public path to the favicons.
      inject: false,
      logo: path.resolve("src", "textures", "star.png"),
      prefix: "favicons/",
      title: APP_NAME,
    }),
    new MiniCssExtractPlugin({
      chunkFilename: "[name].[contenthash].css",
      filename: "[name].[contenthash].css",
    }),
  ];

  const config = {
    context: path.resolve(__dirname, ".."),

    // The path to each entry point is resolved starting from `context`.
    entry: {
      "404": path.resolve("src", "js", "404.js"),
      about: path.resolve("src", "js", "about.js"),
      "bitmap-demo": path.resolve("src", "js", "bitmap-demo.js"),
      home: path.resolve("src", "js", "index.js"),
      "transfer-demo": path.resolve("src", "js", "transfer-demo.js"),
    },
    mode: argv.mode,
    module: {
      rules,
    },
    output: {
      // For HTTP cache busting we want an hash to appear in the asset filename.
      // We could use html-webpack-plugin `hash: true` to have the hash added as
      // a query string. However, `some-file.some-hash.js` is a better idea than
      // `some-file.js?some-hash`. Here is why:
      // http://www.stevesouders.com/blog/2008/08/23/revving-filenames-dont-use-querystring/
      // So we add the hash in the filename here and use `hash: false` with
      // html-webpack-plugin.
      filename: "[name].[hash].js",
      // The output path is resolved starting from `context`
      path: path.resolve("build"),
      publicPath: "/",
      sourceMapFilename: "[file].map",
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
        three: path.resolve("node_modules", "three"),
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
