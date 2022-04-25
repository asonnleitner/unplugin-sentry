import { inspect } from 'util'
import type { SentryCliPluginOptions } from '../types'
import type { UnpluginContextMeta } from 'unplugin'

export const createLogger =
  (options: Partial<SentryCliPluginOptions>, meta?: UnpluginContextMeta) =>
  (label: string, data?: any) => {
    if (options && options.silent) return

    if (data !== undefined) {
      console.log(
        `[sentry-unplugin${
          meta && meta.framework ? '-' + meta.framework : ''
        }] ${label} ${inspect(data, false, null, true)}`
      )
    } else {
      console.log(
        `[sentry-unplugin${
          meta && meta.framework ? '-' + meta.framework : ''
        }] ${label}`
      )
    }
  }
