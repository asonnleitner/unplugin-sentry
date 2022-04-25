import type {
  SentryCliCommitsOptions,
  SentryCliUploadSourceMapsOptions,
  SentryCliNewDeployOptions
} from '@sentry/cli'
import SentryCli from '@sentry/cli'
import type { SentryCliPluginOptions } from '../types'
import { toArray } from '../utils/array'
import { createLogger } from '../utils/logger'
import type { UnpluginContextMeta } from 'unplugin'

const createSentryCli = (
  options?: Partial<SentryCliPluginOptions>,
  meta?: UnpluginContextMeta
): {
  releases: SentryCli['releases']
  options: SentryCli['options'] & SentryCliPluginOptions
  configFile: SentryCli['configFile']
} => {
  options = { rewrite: true, finalize: true, ...options }

  const debugLog = createLogger(options, meta)

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
    url: options?.url,
    authToken: options?.authToken,
    org: options?.org,
    project: options?.project,
    vcsRemote: options?.vcsRemote,
    dist: options?.dist,
    silent: options?.silent,
    customHeader: options?.customHeader
  })

  if (options && options.dryRun) {
    debugLog('Running in dry-run mode')
    const cli: SentryCli = {
      releases: {
        new: (release: string, options?: { projects: string[] } | string[]) => {
          debugLog(`creating new release: "${release}"`, options)
          return Promise.resolve(release)
        },
        setCommits: (release: string, config: SentryCliCommitsOptions) => {
          debugLog('calling set-commits with:\n', config)
          return Promise.resolve(release)
        },
        finalize: (release: string) => {
          debugLog(`finalizing release: "${release}"`)
          return Promise.resolve(release)
        },
        proposeVersion: async () => {
          const version = await cli.releases.proposeVersion()
          debugLog(`proposed version: "${version}"`)
          return version
        },
        uploadSourceMaps: (
          release: string,
          options: SentryCliUploadSourceMapsOptions
        ) => {
          debugLog('calling upload-sourcemaps with:\n', options)
          return Promise.resolve(release)
        },
        listDeploys(release: string) {
          debugLog(`listing deploys for release: "${release}"`)
          return Promise.resolve(release)
        },
        newDeploy: (release: string, options: SentryCliNewDeployOptions) => {
          debugLog('calling deploy with:\n', options)
          return Promise.resolve(release)
        },
        // @ts-ignore
        execute: (args: string[], live: boolean) => {
          debugLog('calling execute with:\n', args)
          return Promise.resolve(args)
        }
      }
    }
    return {
      configFile: options.configFile || cli.configFile,
      releases: cli.releases,
      options: { ...options, ...cli.options } as SentryCliPluginOptions
    }
  } else {
    return {
      configFile: options.configFile || cli.configFile,
      releases: cli.releases,
      options: { ...options, ...cli.options } as SentryCliPluginOptions
    }
  }
}

export default createSentryCli
