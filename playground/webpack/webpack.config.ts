import { resolve } from 'path'
import { default as HtmlWebpackPlugin } from 'html-webpack-plugin'
import SentryPlugin from '../../dist/webpack'

module.exports = {
  entry: ['./main.ts'],
  devtool: 'source-map',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.html$/,
        use: ['html-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js', '.html']
  },
  output: {
    filename: 'index.[contenthash].js',
    path: resolve(__dirname, 'dist')
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './index.html'
    }),
    SentryPlugin()
  ]
}
