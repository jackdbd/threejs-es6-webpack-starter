const path = require('path');

module.exports = {

  entry: path.resolve(__dirname, 'src/index.js'),

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },

  module: {
    rules: [
      // rule for .js/.jsx files
      {
        test: /\.(js|jsx)$/,
        include: [
          path.resolve(__dirname, 'src'),
        ],
        exclude: [
          path.resolve(__dirname, 'node_modules'),
        ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['es2015'],
          },
        },
      },
      // rule for .css files
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
        ],
      },
      // rule for .sass/.scss files
      {
        test: /\.(sass|scss)$/,
        use: [
          {
            loader: 'style-loader',  // create style nodes from JS strings
          },
          {
            loader: 'css-loader',  // translate CSS into CommonJS
          },
          {
            loader: 'sass-loader',  // compile Sass to CSS
          },
        ],
      },
    ],
  },

  devtool: 'source-map',

  devServer: {
    port: 8080,
    contentBase: './dist',
    inline: true,  // live reloading
  },

};
