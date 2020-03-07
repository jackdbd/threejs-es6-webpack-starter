# HTML document fragments

Each file in this directory defines a HTML [DocumentFragment](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment).

These fragments are reused across multiple HTML documents (i.e. pages in the application) to avoid duplicate code.

The fragments are injected in a HTML document thanks to [html-loader's interpolate](https://webpack.js.org/loaders/html-loader/#interpolate) option.
