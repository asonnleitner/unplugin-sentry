import { resolve } from 'path'
import SentryPlugin from '../../dist/webpack'
// import SentryCliPlugin from '@sentry/webpack-plugin'
import type { Configuration } from 'webpack'
import config from '../config'

module.exports = {
  entry: ['./main.ts'],
  // devtool: 'inline-source-map',
  output: {
    filename: '[name].bundle.js',
    path: resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /(node_modules|bower_components)/,
        use: 'ts-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.jsx', '.ts', '.tsx']
  },
  plugins: [
    SentryPlugin({
      ...config
    })
  ]
} as Configuration
