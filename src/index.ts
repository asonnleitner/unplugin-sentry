import { createUnplugin } from 'unplugin'
import type { SentryCliPluginOptions } from './types'
import createSentryCli from './core/cli'
import { ensureKey } from './utils'

export default createUnplugin<Partial<SentryCliPluginOptions>>(
  (options, meta) => {
    const sentry = createSentryCli(options)

    return {
      name: 'unplugin-sentry',
      enforce: 'post',

      vite: {},

      rollup: {},

      webpack(compiler) {},

      esbuild: {},

      buildEnd() {
        console.log('[unplugin-sentry]', 'buildEnd')
      }
    }
  }
)
