// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { defineConfig } from 'rollup'
import typescript from '@rollup/plugin-typescript'
import { terser } from 'rollup-plugin-terser'
import html from '@rollup/plugin-html'
import SentryPlugin from '../../dist/rollup'
import config from '../config'

const makeHtmlAttributes = (attributes) => {
  if (!attributes) {
    return ''
  }
  const keys = Object.keys(attributes)
  // eslint-disable-next-line no-param-reassign
  return keys.reduce(
    (result, key) => (result += ` ${key}="${attributes[key]}"`),
    ''
  )
}

const rollupConfig = defineConfig({
  input: './main.ts',
  output: [
    {
      file: './dist/index.js',
      format: 'iife',
      sourcemap: true
    }
  ],
  plugins: [
    typescript({
      compilerOptions: {
        module: 'ESNext',
        target: 'ESNext',
        moduleResolution: 'Node'
      }
    }),
    process.argv.includes('--production') && terser(),
    html({
      template: ({ title, attributes, publicPath, meta, files }) => {
        const scripts = (files.js || [])
          .map(
            ({ fileName }) =>
              `<script src="${publicPath}${fileName}"${makeHtmlAttributes(
                attributes.script
              )} defer async></script>`
          )
          .join('\n')

        const links = (files.css || [])
          .map(
            ({ fileName }) =>
              `<link href="${publicPath}${fileName}" rel="stylesheet"${makeHtmlAttributes(
                attributes.link
              )}>`
          )
          .join('\n')

        const metas = meta
          .map((input) => `<meta${makeHtmlAttributes(input)}>`)
          .join('\n')

        return `
<!doctype html>
<html${makeHtmlAttributes(attributes.html)}>
  <head>
    ${metas}
    <title>${title}</title>
    ${links}
  </head>
  <body>
    ${scripts}
    <div id="app"></div>
  </body>
</html>`
      }
    }),
    SentryPlugin({
      ...config
    })
  ]
})

export default rollupConfig
