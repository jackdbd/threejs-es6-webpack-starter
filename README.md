# three.js-es6-webpack-starter

[![Build Status](https://travis-ci.org/jackdbd/threejs-es6-webpack-starter.svg?branch=master)](https://travis-ci.org/jackdbd/threejs-es6-webpack-starter) [![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovateapp.com/) [![Code style prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

A minimal three.js ES6 starter project that uses webpack.

![A GIF file showing a preview of the starter project](https://github.com/jackdbd/threejs-es6-webpack-starter/blob/master/preview.gif "A scene with a spotlight, a directional light, a particle system, a custom material and several helpers.")

:warning: If you encounter a `validateschema` error when running `yarn dev`, try downgrading `webpack-cli` to `2.0.0`. It seems a bug that affects only [webpack-dev-server](https://stackoverflow.com/questions/50654952/webpack-dev-server-fails-to-run-with-error-of-validateschema). :warning:

## Features

- ES6 support with [babel-loader](https://github.com/babel/babel-loader)
- Code formatting with [prettier](https://github.com/prettier/prettier)
- CSS support with [style-loader](https://github.com/webpack-contrib/style-loader)
  and [css-loader](https://github.com/webpack-contrib/css-loader)
- CSS linting with [stylelint](https://stylelint.io/)
- Controls with [orbit-controls-es6](https://www.npmjs.com/package/orbit-controls-es6)
- GUI with [dat.GUI](https://github.com/dataarts/dat.gui)
- GLSL shaders support via [webpack-glsl-loader](https://www.npmjs.com/package/webpack-glsl-loader)
- Tests with [jest](https://jestjs.io/en/), [jest-dom](https://github.com/gnapse/jest-dom)
- Webpack configuration with:
  - [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin)
  - [HtmlWebpackPlugin](https://github.com/jantimon/html-webpack-plugin)
  - [BundleAnalyzerPlugin](https://github.com/th0r/webpack-bundle-analyzer)
  - [CompressionPlugin](https://github.com/webpack-contrib/compression-webpack-plugin)
  - [CleanWebpackPlugin](https://github.com/johnagan/clean-webpack-plugin)

## Installation

```shell
git clone git@github.com:jackdbd/threejs-es6-webpack-starter.git
cd threejs-es6-webpack-starter
yarn
```

## Usage (development)

Run `webpack-dev-server` (all bundles will be served from memory)

```shell
yarn dev
```

Go to `localhost:8080` to see your project live!

Go to `localhost:8888` to analyze your webpack bundles with `BundleAnalyzerPlugin`

## Usage (production)

Generate all js/css bundles

```shell
yarn build
```

## Other

Check outdated dependencies

```shell
yarn ncu
```

## Credits

The setup of this starter project was inspired by two snippets on Codepen: [this one](http://codepen.io/mo4_9/pen/VjqRQX) and [this one](https://codepen.io/iamphill/pen/jPYorE).

I understood how to work with lights and camera helpers thanks to
[this snippet](http://jsfiddle.net/f17Lz5ux/5131/) on JSFiddle.

The code for `vertexShader.glsl` and `fragmentShader.glsl` is taken from
[this blog post](http://blog.cjgammon.com/threejs-custom-shader-material).

The star used in the particle system is the PNG preview of [this image](https://commons.wikimedia.org/wiki/File:Star_icon-72a7cf.svg) by Offnfopt
(Public domain or CC0, via Wikimedia Commons).
