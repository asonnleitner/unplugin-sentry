import { resolve, basename } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'
import fg from 'fast-glob'
import chalk from 'chalk'

const main = async () => {
  const files = await fg('*.js', {
    ignore: ['chunk-*'],
    absolute: true,
    cwd: resolve(__dirname, '../dist')
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
}

main().catch(console.error)