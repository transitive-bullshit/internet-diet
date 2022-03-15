import path from 'node:path'
import { createRequire } from 'node:module'
import { Configuration } from 'webpack'
import SizePlugin from 'size-plugin'
import TerserPlugin from 'terser-webpack-plugin'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'

const { resolve: resolvePackage } = createRequire(import.meta.url)

const config: Configuration = {
  devtool: 'source-map',
  stats: {
    all: false,
    errors: true
  },
  entry: {
    content: path.resolve('src', 'content'),
    background: path.resolve('src', 'background'),
    popup: path.resolve('src', 'popup'),
    blocked: path.resolve('src', 'blocked')
  },
  output: {
    path: path.resolve('build')
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'tsx',
          target: 'es2020'
        }
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader',
            options: {
              modules: {
                auto: true,
                localIdentName: '[path][name]__[local]--[hash:base64:5]'
              }
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        resolvePackage('webextension-polyfill'),
        {
          from: 'assets',
          to: 'assets'
        },
        {
          from: 'manifest.json',
          force: true,
          transform: function (content) {
            return Buffer.from(
              JSON.stringify({
                version: process.env.npm_package_version,
                ...JSON.parse(content.toString())
              })
            )
          }
        }
      ]
    }),
    new HtmlWebpackPlugin({
      template: path.resolve('src', 'popup', 'index.html'),
      filename: 'popup.html',
      chunks: ['popup'],
      cache: false
    }),
    new HtmlWebpackPlugin({
      template: path.resolve('src', 'blocked', 'index.html'),
      filename: 'blocked.html',
      chunks: ['blocked'],
      cache: false
    }),
    new SizePlugin({ writeFile: false })
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
        exclude: 'browser-polyfill.min.js',
        extractComments: false
      })
    ]
  }
}

if (process.env.CI) {
  config.stats = {
    assets: true,
    entrypoints: true,
    chunks: true,
    modules: true
  }
}

export default config
