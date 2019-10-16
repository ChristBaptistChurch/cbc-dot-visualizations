var webpack = require('webpack');
var path = require('path');

var config = {
  // devtool: 'inline-source-map',
  mode: 'production',
  entry: './src/index.ts',
  resolve: {
    extensions: ['.ts', '.js']
  },
  output: {
    path: path.resolve('../scripts'),
    filename: 'main.js',
    publicPath: '/Scripts'
  },
  module: {
    rules: [
      {
        test: /\.ts/,
        exclude: [
          /node_modules/
        ],
        use: {
          loader: "ts-loader"
        }
      }
    ]
  }
}

module.exports = config;