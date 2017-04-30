# three.js-es6-webpack-starter
A minimal three.js ES6 starter project that uses webpack 2.

### Features:

* ES6 support via [babel-loader](https://github.com/babel/babel-loader)
* CSS support via [style-loader](https://github.com/webpack-contrib/style-loader)
and [css-loader](https://github.com/webpack-contrib/css-loader)

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
