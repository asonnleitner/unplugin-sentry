import type {
  SentryCliCommitsOptions,
  SentryCliUploadSourceMapsOptions,
  SentryCliNewDeployOptions
} from '@sentry/cli'
import type { SentryCliPluginOptions } from '../types'
import type { UnpluginContextMeta } from 'unplugin'
import { toArray, createLogger } from '../utils'
import SentryCli from '@sentry/cli'

const createSentryCli = (
  pluginOptions: SentryCliPluginOptions,
  pluginMeta: UnpluginContextMeta
): SentryCli => {
  const debugLog = createLogger(pluginOptions, pluginMeta)

  if (pluginOptions.include) {
    pluginOptions.include = toArray(pluginOptions.include)

    pluginOptions.include.forEach((entry) => {
      if (typeof entry === 'object' && entry.ignore !== undefined) {
        entry.ignore = toArray(entry.ignore)
      }
    })
  }

  if (pluginOptions.ignore) {
    pluginOptions.ignore = toArray(pluginOptions.ignore)
  }

  const cli = new SentryCli(pluginOptions?.configFile, {
    url: pluginOptions?.url,
    authToken: pluginOptions?.authToken,
    org: pluginOptions?.org,
    project: pluginOptions?.project,
    vcsRemote: pluginOptions?.vcsRemote,
    dist: pluginOptions?.dist,
    silent: pluginOptions?.silent,
    customHeader: pluginOptions?.customHeader
  })

  if (pluginOptions.dryRun) {
    debugLog('Running in dry-run mode')
    return {
      options: { ...pluginOptions, ...cli.options },
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
      execute(args: string[], live: boolean): Promise<string> {
        debugLog(`calling execute with: ${args.join(' ')}`, { live })
        return Promise.resolve(args.join(' '))
      }
    }
  } else {
    return cli
  }
}

const createRelease = async (
  cli: SentryCli,
  pluginOptions: SentryCliPluginOptions
) =>
  (pluginOptions.release
    ? Promise.resolve(pluginOptions.release)
    : cli.releases.proposeVersion()
  )
    .then((r) => r.trim())
    .catch(() => '')

const injectSentryLoader = async (
  pluginOptions: SentryCliPluginOptions,
  releasePromise: Promise<string>
) => {
  const { project, org } = pluginOptions
  const version = await releasePromise
  let sentryRelease = `var _global = (typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {}); _global.SENTRY_RELEASE={id:"${version}"};`

  if (project) {
    const key = org ? `${project}@${org}` : project
    sentryRelease += `
      _global.SENTRY_RELEASES=_global.SENTRY_RELEASES || {};
      _global.SENTRY_RELEASES["${key}"]={id:"${version}"};
      `
  }

  return sentryRelease
}

export { createSentryCli, createRelease, injectSentryLoader }
