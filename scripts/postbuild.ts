import { resolve, basename, parse } from 'node:path'
import { readFile, writeFile, copyFile } from 'node:fs/promises'
import fg from 'fast-glob'
import chalk from 'chalk'
import { SENTRY_LOADER, SENTRY_MODULE } from '../src/webpack/constants'

const copySentryFiles = async (dist: string) => {
  for (const file of [SENTRY_LOADER, SENTRY_MODULE]) {
    await copyFile(file, resolve(dist, basename(file)))
  }
}

const main = async () => {
  const dist = resolve(__dirname, '../dist')

  const files = await fg('*.js', {
    ignore: ['chunk-*'],
    absolute: true,
    cwd: dist
  })

  for (const file of files) {
    console.log(chalk.cyan.inverse(' POST '), `Fix ${basename(file)}`)
    if (file === 'index.js') {
      // fix cjs exports
      let code = await readFile(file, 'utf8')
      code = code.replace('exports.default =', 'module.exports =')
      code += 'exports.default = module.exports;'
      await writeFile(file, code)
    }
    // generate submodule .d.ts redirecting
    const name = basename(file, '.js')
    await writeFile(
      `${name}.d.ts`,
      `export { default } from './dist/${name}'\n`
    )
  }

  // copy files to dist
  await copySentryFiles(dist)
}

main().catch(console.error)
