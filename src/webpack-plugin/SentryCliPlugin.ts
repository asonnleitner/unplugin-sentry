import type { WebpackPluginInstance } from 'webpack'
import type { SentryCliPluginOptions } from '../types'
import type { Compiler, Entry, EntryNormalized, RuleSetRule } from 'webpack'
import type {
  SentryCliCommitsOptions,
  SentryCliNewDeployOptions,
  SentryCliUploadSourceMapsOptions
} from '@sentry/cli'
import {
  attachAfterCodeGenerationHook,
  attachAfterEmitHook,
  deepCopy,
  diffArray,
  ensureKeyValue,
  getLoaderName,
  isArray,
  toArray
} from './utils'
import SentryCli from '@sentry/cli'
import { inspect } from 'util'
import path from 'path'

const SENTRY_LOADER_PATH = path.resolve(__dirname, 'sentry.loader.js')
const SENTRY_MODULE_PATH = path.resolve(__dirname, 'sentry-webpack.module.js')

export class SentryCliPlugin implements WebpackPluginInstance {
  options: Partial<SentryCliPluginOptions & SentryCliCommitsOptions> = {
    finalize: true,
    rewrite: true
  }
  cli: SentryCli
  release: () => Promise<string>

  constructor(options: SentryCliPluginOptions & SentryCliCommitsOptions) {
    this.options = { ...this.options, ...options }

    if (options.include) {
      this.options.include = toArray(options.include)
      this.options.include.forEach((include) => {
        if (typeof include === 'object' && include.ignore !== undefined) {
          include.ignore = toArray(include.ignore)
        }
      })
    }

    if (options.ignore) {
      this.options.ignore = toArray(options.ignore)
    }

    this.cli = this.sentryCli
    this.release = this.releasePromise
  }

  get sentryCli() {
    const cli = new SentryCli(this.options.configFile, {
      url: this.options.url,
      authToken: this.options.authToken,
      org: this.options.org,
      project: this.options.project,
      vcsRemote: this.options.vcsRemote,
      dist: this.options.dist,
      silent: this.options.silent,
      customHeader: this.options.customHeader
    })

    if (!this.options.dryRun) {
      return cli
    } else {
      this.debugLog('Running in dry-run mode')
      const cli = {
        releases: {
          new: (
            release: string,
            options?: { projects: string[] } | string[]
          ) => {
            this.debugLog(`Prepared release: "${release}"`, options)
            return Promise.resolve(release)
          },
          setCommits: (release: string, options: SentryCliCommitsOptions) => {
            this.debugLog(`Set commits for release: "${release}"`, options)
            return Promise.resolve(release)
          },
          finalize: (release: string) => {
            this.debugLog(`Finalized release: "${release}"`)
            return Promise.resolve(release)
          },
          proposeVersion: async () => {
            const version = (await cli.releases.proposeVersion()) as string
            this.debugLog(`Proposed version: "${version}"`)
            return version
          },
          uploadSourceMaps: (
            release: string,
            options: SentryCliUploadSourceMapsOptions
          ) => {
            this.debugLog(
              `Uploaded source maps for release: "${release}"`,
              options
            )
            return Promise.resolve(release)
          },
          listDeploys: (release: string) => {
            this.debugLog(`List deploys for release: "${release}"`)
            return Promise.resolve(release)
          },
          newDeploy: (release: string, options: SentryCliNewDeployOptions) => {
            this.debugLog(`New deploy for release: "${release}"`, options)
            return Promise.resolve(release)
          },
          execute: (args: string[], live: boolean) => {
            this.debugLog(`Executed: ${args.join(' ')}`, { live })
            return Promise.resolve('')
          }
        }
      }
      return cli as SentryCli
    }
  }

  releasePromise() {
    return (
      this.options.release
        ? Promise.resolve(this.options.release)
        : this.cli.releases.proposeVersion()
    )
      .then((version) => version.trim())
      .catch(() => '')
  }

  // Checks if the given named entry point should be handled.
  shouldInjectEntry(key: string) {
    const { entries } = this.options
    if (entries === undefined || entries === null) return true

    if (typeof entries === 'function') return entries(key)

    if (entries instanceof RegExp) return entries.test(key)

    if (isArray(entries)) return entries.includes(key)

    throw new Error(
      `Invalid \`entries\` option: ${entries}, must be a function, RegExp or array`
    )
  }

  // Injects the release string into the given entry point.
  injectEntry(entry: Entry | EntryNormalized | Function, sentryModule: any) {
    if (!entry) return sentryModule

    if (typeof entry === 'string') return [sentryModule, entry]

    if (isArray(entry)) return [sentryModule].concat(entry)

    if (typeof entry === 'function')
      return () =>
        Promise.resolve(entry()).then((resolvedEntry) =>
          this.injectEntry(resolvedEntry, sentryModule)
        )

    const modifiedEntry = { ...entry }

    Object.keys(modifiedEntry)
      .filter((key) => this.shouldInjectEntry(key))
      .forEach((key) => {
        if (entry[key] && (entry[key] as any).import) {
          ;(modifiedEntry[key] as any).import = this.injectEntry(
            (entry[key] as any).import,
            sentryModule
          )
        } else {
          modifiedEntry[key] = this.injectEntry(
            entry[key] as Entry,
            sentryModule
          )
        }
      })

    return modifiedEntry
  }

  // webpack 2.x
  injectLoader(loaders: any[] = []) {
    const loader = {
      test: /sentry-webpack\.module\.js$/,
      loader: SENTRY_LOADER_PATH,
      options: {
        releasePromise: this.release,
        org: this.options.org || process.env.SENTRY_ORG,
        project: this.options.project || process.env.SENTRY_PROJECT
      }
    }

    return loaders.concat([loader])
  }

  // webpack 3.x
  injectRule(rules: (RuleSetRule | '...')[] = []) {
    const rule = {
      test: /sentry-webpack\.module\.js$/,
      use: [
        {
          loader: SENTRY_LOADER_PATH,
          options: {
            releasePromise: this.release,
            org: this.options.org || process.env.SENTRY_ORG,
            project: this.options.project || process.env.SENTRY_PROJECT
          }
        }
      ]
    }

    return rules.concat([rule])
  }

  // Injects the release entry points and rules into the given options.
  injectRelease(options: Compiler['options']) {
    options.entry = this.injectEntry(options.entry, SENTRY_MODULE_PATH)

    // @ts-ignore webpack 2.x
    if (options.module && options.module.loaders) {
      // @ts-ignore webpack 2.x
      options.module.loaders = this.injectLoader(options.module.loaders)
    } else {
      options.module.rules = this.injectRule(options.module.rules)
    }
  }

  // injectRelease with debug details
  injectReleaseDebug(options: Compiler['options']) {
    const input = {
      // @ts-ignore webpack 2.x
      loaders: deepCopy(options.module.loaders || options.module.rules).map(
        getLoaderName
      ),
      entry: deepCopy(options.entry)
    }

    this.injectRelease(options)

    const output = {
      // @ts-ignore webpack 2.x
      loaders: deepCopy(options.module.loaders || options.module.rules).map(
        getLoaderName
      ),
      entry: deepCopy(options.entry)
    }

    const loaders = diffArray(input.loaders, output.loaders)
    const entry = diffArray(input.entry, output.entry)

    this.debugLog(`[DEBUG] Injected release code`)
    // loaders
    this.debugLog(`[DEBUG] - Loaders:`, output.loaders)
    this.debugLog(`[DEBUG] - Added loader:`, loaders.added)
    this.debugLog(`[DEBUG] - Removed loader:`, loaders.removed)
    // entry
    this.debugLog(`[DEBUG] - Entry:`, output.entry)
    this.debugLog(`[DEBUG] - Added entry:`, entry.added)
    this.debugLog(`[DEBUG] - Removed entry:`, entry.removed)
  }

  async finalizeRelease(compilation: any) {
    const { include, errorHandler = (_, invokeErr) => invokeErr() } =
      this.options

    try {
      // get release version
      const release = await this.release()

      if (!include) {
        new Error('No include option provided')
      }

      if (!release) {
        new Error(
          'Unable to get release version. Make sure to include `release` option or use the environment that supports auto-detection.\nhttps://docs.sentry.io/cli/releases/#creating-releases'
        )
      }

      // create new release
      await this.cli.releases.new(release)

      // clean artifacts (optional)
      if (this.options.cleanArtifacts) {
        await this.cli.releases.execute(
          ['releases', 'files', release, 'delete', '--all'],
          true
        )
      }

      // upload source maps
      await this.cli.releases.uploadSourceMaps(
        release,
        this.options as SentryCliUploadSourceMapsOptions
      )

      // set commits
      const { auto, repo, commit, previousCommit, ignoreMissing, ignoreEmpty } =
        this.options.setCommits || this.options

      if (auto || (repo && commit)) {
        await this.cli.releases.setCommits(release, {
          auto,
          repo,
          commit,
          previousCommit,
          ignoreMissing,
          ignoreEmpty
        })
      }

      // finalize release
      if (this.options.finalize) {
        await this.cli.releases.finalize(release)
      }

      // create new deployment
      const { env, started, finished, time, name, url } =
        this.options.deploy || {}

      if (env) {
        await this.cli.releases.newDeploy(release, {
          env,
          started,
          finished,
          time,
          name,
          url
        })
      }
    } catch (err) {
      errorHandler(
        err as Error,
        () =>
          compilation.errors.push(
            new Error(`Sentry CLI Plugin: ${(err as Error).message}`)
          ),
        compilation
      )
    }
  }

  // webpack plugin
  apply(compiler: Compiler) {
    if (this.options.runOnce && (module as any).alreadyRun) {
      if (this.options.debug) {
        this.debugLog('`runOnce` option is enabled, skipping...')
      }
      return
    }

    ;(module as any).alreadyRun = true

    const compilerOptions = compiler.options || {}
    ensureKeyValue(compilerOptions, 'module', Object)

    if (this.options.debug) {
      this.injectReleaseDebug(compilerOptions)
    } else {
      this.injectRelease(compilerOptions)
    }

    attachAfterCodeGenerationHook(compiler, {
      releasePromise: this.release,
      org: this.options.org || (process.env.SENTRY_ORG as string),
      project: this.options.project || (process.env.SENTRY_PROJECT as string)
    })

    attachAfterEmitHook(compiler, (compilation, fn) => {
      if (!this.options.include || !(this.options.include as any).length) {
        ensureKeyValue(compilerOptions, 'output', Object)
        if (compilerOptions.output.path) {
          this.options.include = [compilerOptions.output.path]
        }
      }

      this.finalizeRelease(compilation).then(() => fn())
    })
  }

  debugLog(label: string, data?: any) {
    if (this.options.silent) return

    if (data !== undefined) {
      console.log(
        `[Sentry Webpack Plugin] ${label} ${inspect(data, false, null, true)}`
      )
    } else {
      console.log(`[Sentry Webpack Plugin] ${label}`)
    }
  }
}
