import SentryCli from '@sentry/cli'
import type { SentryCliPluginOptions } from '../types'
import { toArray } from '../utils/array'

const createSentryCli = (options?: Partial<SentryCliPluginOptions>) => {
  options = { rewrite: true, finalize: true, ...options }

  if (options && 'include' in options) {
    options.include = toArray(options.include)

    options.include.forEach((entry) => {
      if (typeof entry === 'object' && entry.ignore !== undefined) {
        entry.ignore = toArray(entry.ignore)
      }
    })
  }

  if (options && options.ignore) {
    options.ignore = toArray(options.ignore)
  }

  const cli = new SentryCli(options?.configFile, {
    silent: options?.silent,
    org: options?.org,
    project: options?.project,
    authToken: options?.authToken,
    url: options?.url,
    vcsRemote: options?.vcsRemote
  })

  const release = (
    options && options.release
      ? Promise.resolve(options.release)
      : cli.releases.proposeVersion()
  )
    .then((version) => version.trim())
    .catch(() => undefined)

  return { cli, release, options }
}

export default createSentryCli
