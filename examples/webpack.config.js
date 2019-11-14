const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')
const fs = require('fs')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

const createAlias = (name, fallback) =>
  fs.existsSync(`./../../${name}`) ? path.resolve(`./../../${name}`) : fallback || name

module.exports = mode => {
  return {
    mode,
    entry: 'index.js',
    output: {
      filename: 'bundle.js',
      path: path.resolve('./dist'),
      publicPath: '/',
    },
    module: {
      rules: [
        { test: /\.css$/, use: ['style-loader', 'css-loader'] },
        {
          test: /\.(js|jsx|tsx|ts)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              babelrc: false,
              presets: [
                [
                  '@babel/preset-env',
                  {
                    modules: false,
                    loose: true,
                    useBuiltIns: false,
                    targets: { browsers: 'last 2 Chrome versions' },
                  },
                ],
                '@babel/preset-react',
                '@babel/preset-typescript',
              ],
              plugins: [
                '@babel/plugin-syntax-dynamic-import',
                ['@babel/plugin-proposal-class-properties', { loose: true }],
              ],
            },
          },
        },
        {
          test: /\.(gif|png|jpe?g|svg)$/i,
          use: ['file-loader', { loader: 'image-webpack-loader' }],
        },
      ],
    },
    resolve: {
      modules: [path.resolve('./'), 'node_modules'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      alias: {
        'react-three-fiber': path.resolve(`../src/targets/web/index.ts`),
        //'react-three-fiber/extras': path.resolve(`../src/extras/index.ts`),
        //scheduler: path.resolve('node_modules/scheduler'),
        react: path.resolve('node_modules/react'),
        'react-dom': path.resolve('node_modules/react-dom'),
        'prop-types': path.resolve('node_modules/prop-types'),
        //three: path.resolve('node_modules/three'),
        //three$: path.resolve('node_modules/three/src/Three'),
        three$: path.resolve('./resources/three.js'),
        '../../../build/three.module.js': path.resolve('./resources/three.js'),
        'react-spring/three': createAlias('react-spring/src/targets/three', 'react-spring/three'),
        'react-use-gesture': createAlias('react-use-gesture/index.js', 'react-use-gesture'),
        //'react-use-measure': createAlias('react-use-measure/src/web', '../node_modules/react-use-measure'),
        //'pointer-events-polyfill': createAlias('pointer-events-polyfill/dist/pep.js', 'pointer-events-polyfill'),
      },
    },
    optimization: {
      splitChunks: {
        // include all types of chunks
        chunks: 'all',
      },
    },
    plugins: [
      new HtmlWebpackPlugin({ template: 'public/index.html' }),
      ...(mode === 'production' ? [new BundleAnalyzerPlugin()] : []),
    ],
    devServer: { hot: false, contentBase: path.resolve('./'), stats: 'errors-only' },
    devtool: undefined,
    performance: { hints: false },
  }
}
