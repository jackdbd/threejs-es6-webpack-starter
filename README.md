# three.js-es6-webpack-starter
A minimal three.js ES6 starter project that uses webpack 2.

![A GIF file showing a preview of the starter project](https://github.com/jackaljack/threejs-es6-webpack-starter/blob/master/preview.gif "A scene with a spotlight, a directional light, a particle system, a custom material and several helpers.")

### Features:

* ES6 support via [babel-loader](https://github.com/babel/babel-loader)
* CSS support via [style-loader](https://github.com/webpack-contrib/style-loader)
and [css-loader](https://github.com/webpack-contrib/css-loader)
* SASS support via [sass-loader](https://github.com/jtangelder/sass-loader)
* ES6 linting via [eslint](https://www.npmjs.com/package/eslint) and
[eslint-config-airbnb](https://www.npmjs.com/package/eslint-config-airbnb)
* SASS linting via [sass-lint](https://www.npmjs.com/package/sass-lint)
* Controls via [orbit-controls-es6](https://www.npmjs.com/package/orbit-controls-es6)
* GUI via [dat.GUI](https://github.com/dataarts/dat.gui)
* GLSL shaders support via [webpack-glsl-loader](https://www.npmjs.com/package/webpack-glsl-loader)

### Installation

```
git clone git@github.com:jackaljack/threejs-es6-webpack-starter.git
cd threejs-es6-webpack-starter

yarn install
```

### Usage

If you want to generate `bundle.js`, run:

```
yarn run build
```

Otherwise, if you want to run `webpack-dev-server` in memory, run:

```
yarn run start
```

Open your browser at `localhost:8080` to see your project live!

You can change the port of `webpack-dev-server` in `webpack.config.js`.


### Credits

The setup of this starter project was inspired by two snippets on Codepen: [this one](http://codepen.io/mo4_9/pen/VjqRQX) and [this one](https://codepen.io/iamphill/pen/jPYorE).

I understood how to work with lights and camera helpers thanks to
[this snippet](http://jsfiddle.net/f17Lz5ux/5131/) on JSFiddle.

The code for `vertexShader.glsl` and `fragmentShader.glsl` is taken from
[this blog post](http://blog.cjgammon.com/threejs-custom-shader-material).

The star used in the particle system is the PNG preview of [this image](https://commons.wikimedia.org/wiki/File:Star_icon-72a7cf.svg) by Offnfopt
(Public domain or CC0, via Wikimedia Commons).