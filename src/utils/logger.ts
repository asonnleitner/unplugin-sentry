import { inspect } from 'util'
import type { SentryCliPluginOptions } from '../types'
import type { UnpluginContextMeta } from 'unplugin'

export const createLogger =
  (pluginOptions: SentryCliPluginOptions, pluginMeta: UnpluginContextMeta) =>
  (label: string, data?: any) => {
    if (pluginOptions.silent) return

    if (data !== undefined) {
      console.log(
        `[sentry-unplugin${
          pluginMeta && pluginMeta.framework ? '-' + pluginMeta.framework : ''
        }] ${label} ${inspect(data, false, null, true)}`
      )
    } else {
      console.log(
        `[sentry-unplugin${
          pluginMeta && pluginMeta.framework ? '-' + pluginMeta.framework : ''
        }] ${label}`
      )
    }
  }
