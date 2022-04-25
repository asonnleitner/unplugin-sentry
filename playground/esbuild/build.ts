/* eslint-disable */
import fs from 'fs'
import { resolve } from 'path'
import esbuild from 'esbuild'
import SentryPlugin from '../../dist/esbuild'

const dist = resolve(__dirname, 'dist')
const htmlTemplate = resolve(__dirname, './index.html')

const cpHtml = (src: string, dest: string) => {
  let html = fs.readFileSync(src, 'utf8')
  html = html.replace(
    '<!-- esbuild:js -->',
    '<script src="./index.js" async defer></script>'
  )
  fs.mkdirSync(dist, { recursive: true })
  fs.writeFileSync(dest, html)
}

const build = () => {
  esbuild
    .build({
      entryPoints: [resolve(__dirname, './main.ts')],
      outfile: resolve(dist, 'index.js'),
      minify: process.argv.includes('--production'),
      sourcemap: process.argv.includes('--production'),
      bundle: true,
      watch: !process.argv.includes('--production'),
      plugins: [SentryPlugin()]
    })
    .then(() => {
      cpHtml(htmlTemplate, resolve(dist, 'index.html'))
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}

build()
