import type SentryCli from '@sentry/cli'
import type { SentryCliPluginOptions } from '../types'

export const createRelease = async (
  cli: SentryCli,
  options: SentryCliPluginOptions
) =>
  (options.release
    ? Promise.resolve(options.release)
    : cli.releases.proposeVersion()
  )
    .then((r) => r.trim())
    .catch(() => '')
