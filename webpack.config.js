const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {

  entry: {
    home: path.join(__dirname, 'src', 'js', 'index.js'),
    about: path.join(__dirname, 'src', 'js', 'about.js'),
  },

  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].[chunkhash].bundle.js',
    sourceMapFilename: '[file].map',
  },

  target: 'web',

  module: {
    rules: [
      // rule for .js/.jsx files
      {
        test: /\.(js|jsx)$/,
        include: [
          path.join(__dirname, 'js', 'src'),
        ],
        exclude: [
          path.join(__dirname, 'node_modules'),
        ],
        use: {
          loader: 'babel-loader',
        },
      },
      // rule for .css files
      {
        test: /\.css$/,
        include: path.join(__dirname, 'src', 'css'),
        use: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader' }),
      },
      // rule for .sass files
      {
        test: /\.(sass|scss)$/,
        include: [
          path.join(__dirname, 'src', 'sass'),
        ],
        use: ExtractTextPlugin.extract({ fallback: 'style-loader', use: ['css-loader', 'sass-loader'] }),
      },
      // rule for .glsl files (shaders)
      {
        test: /\.glsl$/,
        use: [
          {
            loader: 'webpack-glsl-loader',
          },
        ],
      },
      // rule for textures (images)
      {
        test: /\.(jpe?g|png)$/i,
        include: path.join(__dirname, 'src', 'textures'),
        loaders: [
          'file-loader',
          {
            loader: 'image-webpack-loader',
            query: {
              progressive: true,
              optimizationLevel: 7,
              interlaced: false,
              pngquant: {
                quality: '65-90',
                speed: 4,
              },
            },
          },
        ],
      },
    ],
  },

  devtool: 'cheap-source-map',

  plugins: [
    new BundleAnalyzerPlugin(),
    new CleanWebpackPlugin(
      ['dist'],
      { root: __dirname, exclude: ['favicon.ico'], verbose: true }),
    new ExtractTextPlugin('[name].[chunkhash].bundle.css'),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'templates', 'index.html'),
      hash: true,
      filename: 'index.html',
      chunks: ['commons', 'home'],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'templates', 'about.html'),
      hash: true,
      filename: 'about.html',
      chunks: ['commons', 'about'],
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'commons',
      filename: '[name].[chunkhash].bundle.js',
      chunks: ['home'],
    }),
    new CompressionPlugin({
      asset: '[path].gz[query]',
      algorithm: 'gzip',
      test: /\.(js|html)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),
  ],

  devServer: {
    host: 'localhost',
    port: 8080,
    contentBase: path.join(__dirname, 'dist'),
    inline: true, // live reloading
    stats: {
      colors: true,
      reasons: true,
      chunks: false,
      modules: false,
    },
  },

  performance: {
    hints: 'warning',
  },

};
