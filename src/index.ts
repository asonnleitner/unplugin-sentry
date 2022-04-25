import { createUnplugin } from 'unplugin'
import type { SentryCliPluginOptions } from './types'
import createSentryCli from './core/cli'

export default createUnplugin<Partial<SentryCliPluginOptions>>(
  (options, meta) => {
    const cli = createSentryCli(options, meta)

    return {
      name: 'sentry-unplugin',
      enforce: 'post',

      vite: {},

      rollup: {},

      webpack(compiler) {},

      esbuild: {},

      buildEnd() {
        debugger
      }
    }
  }
)
