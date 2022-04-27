import type { SentryCliPluginOptions } from './types'
import { createUnplugin } from 'unplugin'
import {
  createSentryCli,
  createRelease,
  injectSentryLoader
} from './core/sentry'
import { createLogger } from './utils'
import { finalizeRelease } from './core/finalize'
import { injectRelease, injectReleaseWithDebug } from './webpack/inject'
import {
  attachAfterCodeGenerationHook,
  attachAfterEmitHook
} from './webpack/hooks'

export default createUnplugin<SentryCliPluginOptions>((options, meta) => {
  if (!options) throw new Error('[sentry-unplugin] options is required.')
  const pluginOptions = { rewrite: true, finalize: true, ...options }

  const cli = createSentryCli(pluginOptions, meta)
  const releasePromise = createRelease(cli, pluginOptions)
  const debugLog = createLogger(pluginOptions, meta)

  return {
    name: 'sentry-unplugin',
    enforce: 'post',

    vite: {
      // ...
    },

    rollup: {
      // ...
    },

    webpack(compiler) {
      const compilerOptions = {
        ...compiler.options,
        module: { ...compiler.options.module },
        output: { ...compiler.options.output }
      }

      if (pluginOptions.debug) {
        debugLog('injecting release with debug')
        injectReleaseWithDebug(
          compilerOptions,
          pluginOptions,
          releasePromise,
          meta
        )
      } else {
        debugLog('injecting release')
        injectRelease(compilerOptions, pluginOptions, releasePromise)
      }

      attachAfterCodeGenerationHook(compiler, pluginOptions, releasePromise)

      attachAfterEmitHook(compiler, (compilation, callback) => {
        console.log('Sentry CLI Plugin: Uploading source maps')
        if (
          !pluginOptions.include ||
          !(pluginOptions.include as any[]).length
        ) {
          if (compilerOptions.output.path) {
            pluginOptions.include = [compilerOptions.output.path]
          }
        }

        finalizeRelease(cli, pluginOptions, releasePromise, compilation).then(
          () => callback()
        )
      })
      // ...
    },

    esbuild: {
      // ...
    },

    transformInclude(id) {
      return id.endsWith('sentry.module.js')
    },

    async transform(code, id) {
      const injectCode = await injectSentryLoader(pluginOptions, releasePromise)
      return code + '\n' + injectCode
    },

    async buildEnd() {
      // await finalizeRelease(cli, pluginOptions, releasePromise)
    },
    generateBundle() {
      // const ref = this.emitFile({
      //   type: 'asset',
      //   fileName: 'sentry-cli.js',
      //   source: `
      //     const SentryCli = require('${meta.framework}')
      //     module.exports = SentryCli
      //   `
      // })
      //
      // const fileName = this.getFileName(ref)
      // console.log({ fileName, ref })
    }
  }
})
