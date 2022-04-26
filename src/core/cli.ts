import type {
  SentryCliCommitsOptions,
  SentryCliUploadSourceMapsOptions,
  SentryCliNewDeployOptions
} from '@sentry/cli'
import type { SentryCliPluginOptions } from '../types'
import type { UnpluginContextMeta } from 'unplugin'
import { toArray } from '../utils/array'
import { createLogger } from '../utils/logger'
import SentryCli from '@sentry/cli'

const createSentryCli = (
  options: SentryCliPluginOptions,
  meta?: UnpluginContextMeta
): SentryCli => {
  const debugLog = createLogger(options, meta)

  if (options.include) {
    options.include = toArray(options.include)

    options.include.forEach((entry) => {
      if (typeof entry === 'object' && entry.ignore !== undefined) {
        entry.ignore = toArray(entry.ignore)
      }
    })
  }

  if (options.ignore) {
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

  if (options.dryRun) {
    debugLog('Running in dry-run mode')
    return {
      releases: {
        new: (release: string, options?: { projects: string[] } | string[]) => {
          debugLog(`creating new release: "${release}"`, options)
          return Promise.resolve(release)
        },
        setCommits: (release: string, options: SentryCliCommitsOptions) => {
          debugLog(`calling set-commits with for "${release}":`, options)
          return Promise.resolve(release)
        },
        finalize: (release: string) => {
          debugLog(`finalizing release "${release}"`)
          return Promise.resolve(release)
        },
        proposeVersion: async () => {
          const release = await cli.releases.proposeVersion()
          debugLog(`proposed version: "${release}"`)
          return release
        },
        uploadSourceMaps: (
          release: string,
          options: SentryCliUploadSourceMapsOptions
        ) => {
          debugLog(`calling upload-sourcemaps for "${release}" with:`, options)
          return Promise.resolve(release)
        },
        listDeploys(release: string) {
          debugLog(`listing deploys for release: "${release}"`)
          return Promise.resolve(release)
        },
        newDeploy: (release: string, options: SentryCliNewDeployOptions) => {
          debugLog(`calling deploy for "${release}" with:`, options)
          return Promise.resolve(release)
        },
        execute: (args: string[], live: boolean) => {
          debugLog(`calling execute with: ${args.join(' ')}`, { live })
          return Promise.resolve(args.join(' '))
        }
      },
      options: { ...options, ...cli.options },
      execute(args: string[], live: boolean): Promise<string> {
        debugLog(`calling execute with: ${args.join(' ')}`, { live })
        return Promise.resolve(args.join(' '))
      }
    }
  } else {
    return cli
  }
}

export default createSentryCli
