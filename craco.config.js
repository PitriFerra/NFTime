const webpack = require('webpack');
const {CracoAliasPlugin} = require('react-app-alias')

module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          url: require.resolve('url'),
          assert: require.resolve('assert'),
          crypto: require.resolve('crypto-browserify'),
          http: require.resolve('stream-http'),
          https: require.resolve('https-browserify'),
          os: require.resolve('os-browserify/browser'),
          buffer: require.resolve('buffer'),
          stream: require.resolve('stream-browserify'),
          "fs": false,
          path: require.resolve('path-browserify'),
          'process/browser': require.resolve('process/browser')
        },
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      },
      plugins: [
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser",
        }),
      ],
    },
  },
  plugins: [
    {
      plugin: CracoAliasPlugin,
      options: {
        baseUrl: '.'
      }
    }
  ]
};