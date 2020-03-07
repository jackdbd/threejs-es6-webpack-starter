# HTML documents

Each file in this directory represents a page in the application.

This is a multi page aplication, so [each Webpack entry point](https://webpack.js.org/concepts/entry-points/#multi-page-application) associated to a page uses one of these files as a template.

[html-webpack-plugin](https://webpack.js.org/plugins/html-webpack-plugin/) picks the HTML document associated to the entry point and injects the [chunks](https://github.com/jantimon/html-webpack-plugin#filtering-chunks) required for the page.
