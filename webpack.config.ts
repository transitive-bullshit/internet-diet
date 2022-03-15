import path from 'node:path'
import { createRequire } from 'node:module'
import { Configuration } from 'webpack'
import SizePlugin from 'size-plugin'
import TerserPlugin from 'terser-webpack-plugin'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'

const { resolve: resolvePackage } = createRequire(import.meta.url)

const config: Configuration = {
  devtool: 'source-map',
  stats: {
    all: false,
    errors: true
  },
  entry: {
    content: './src/content',
    background: './src/background'
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
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        resolvePackage('webextension-polyfill'),
        {
          from: 'dist'
        },
        {
          from: 'dist/manifest.json',
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
    new SizePlugin({ writeFile: false })
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  optimization: {
    // Keeps it somewhat readable for AMO reviewers
    minimizer: [
      new TerserPlugin({
        parallel: true,
        exclude: 'browser-polyfill.min.js',
        terserOptions: {
          mangle: false,
          output: {
            beautify: true,
            indent_level: 2
          }
        }
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
