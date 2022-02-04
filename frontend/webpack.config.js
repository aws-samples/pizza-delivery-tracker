const webpack = require('webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/app.ts',
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [{
        // TODO: Remove the below rule for .mjs, once aws-amplify supports webpack 5
        // https://github.com/graphql/graphql-js/issues/2721#issuecomment-723008284
        test: /\.m?js/,
        resolve: {
          fullySpecified: false
        }
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'svg-url-loader',
            options: {
              limit: 10000,
            },
          },
        ],
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      "fs": false,
      "path": false,
      "debounce": false,
    }
  },
  devServer: {
    client: {
      overlay: true,
    },
    hot: true,
    watchFiles: ['src/*', 'public/index.html']
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: ['public/'],
    }),
    new webpack.HotModuleReplacementPlugin()
  ]
};
