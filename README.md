# three.js-es6-webpack-starter

[![Build Status](https://travis-ci.org/jackdbd/threejs-es6-webpack-starter.svg?branch=master)](https://travis-ci.org/jackdbd/threejs-es6-webpack-starter) [![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovateapp.com/) [![Code style prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

Three.js ES6 starter project with a sane webpack configuration.

![A GIF file showing a demo of the starter project](https://github.com/jackdbd/threejs-es6-webpack-starter/blob/master/demo.gif "A scene with a spotlight, a directional light, an ambient light, a particle system, a custom material and several helpers.")

## Features

- ES6 with [babel-loader](https://github.com/babel/babel-loader)
- JS linting + code formatting with [eslint](https://eslint.org/) and [prettier](https://github.com/prettier/prettier)
- CSS linting with [stylelint](https://stylelint.io/)
- Controls with [orbit-controls-es6](https://www.npmjs.com/package/orbit-controls-es6)
- GUI with [dat.GUI](https://github.com/dataarts/dat.gui)
- Tests with [jest](https://jestjs.io/en/)
- Webpack configuration with:
  - [@packtracker/webpack-plugin](https://github.com/packtracker/webpack-plugin) (bundle sizes [here](https://app.packtracker.io/organizations/129/projects/110))
  - [clean-webpack-plugin](https://github.com/johnagan/clean-webpack-plugin)
  - [compression-webpack-plugin](https://github.com/webpack-contrib/compression-webpack-plugin)
  - [duplicate-package-checker-webpack-plugin](https://github.com/darrenscerri/duplicate-package-checker-webpack-plugin)
  - [favicons-webpack-plugin](https://github.com/jantimon/favicons-webpack-plugin)
  - [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)
  - [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin)
  - [webpack-bundle-analyzer](https://github.com/th0r/webpack-bundle-analyzer)
  - [webpack-glsl-loader](https://github.com/grieve/webpack-glsl-loader)

## Installation

```shell
git clone git@github.com:jackdbd/threejs-es6-webpack-starter.git
cd threejs-es6-webpack-starter
yarn
```

## Usage (development)

Run `webpack-dev-server` (js/css bundles will be served from memory)

```shell
yarn start
```

Go to `localhost:8080` to see your project live!

## Usage (production)

Generate all js/css bundles

```shell
yarn build
```

## Other

Analyze webpack bundles offline:

```shell
yarn build  # to generate build/stats.json
yarn stats  # uses webpack-bundle-analyzer as CLI
```

or push to a CI (e.g. [Travis CI](https://travis-ci.com/)), let it build your project and analyze your bundles online at [packtracker.io](https://packtracker.io/).

Check outdated dependencies with [npm-check-updates](https://github.com/tjunnone/npm-check-updates):

```shell
yarn ncu
```

Update all outdated dependencies at once:

```shell
yarn ncuu
```

Or let [updtr](https://github.com/peerigon/updtr) update all your dependencies for you:

```shell
yarn updtr
```

## Credits

The setup of this starter project was inspired by two snippets on Codepen: [this one](http://codepen.io/mo4_9/pen/VjqRQX) and [this one](https://codepen.io/iamphill/pen/jPYorE).

I understood how to work with lights and camera helpers thanks to
[this snippet](http://jsfiddle.net/f17Lz5ux/5131/) on JSFiddle.

The code for `vertexShader.glsl` and `fragmentShader.glsl` is taken from
[this blog post](http://blog.cjgammon.com/threejs-custom-shader-material).

The star used in the particle system is the PNG preview of [this image](https://commons.wikimedia.org/wiki/File:Star_icon-72a7cf.svg) by Offnfopt
(Public domain or CC0, via Wikimedia Commons).
