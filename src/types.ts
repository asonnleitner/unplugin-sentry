import type {
  SentryCliCommitsOptions,
  SentryCliNewDeployOptions,
  SentryCliOptions,
  SentryCliUploadSourceMapsOptions
} from '@sentry/cli'

import type { SourceMapsPathDescriptor } from '@sentry/cli'

export { SourceMapsPathDescriptor }

export interface SentryCliPluginOptions
  extends Pick<
      SentryCliOptions,
      | 'url'
      | 'authToken'
      | 'org'
      | 'project'
      | 'vcsRemote'
      | 'dist'
      | 'silent'
      | 'customHeader'
    >,
    Pick<
      SentryCliUploadSourceMapsOptions,
      | 'ignoreFile'
      | 'rewrite'
      | 'sourceMapReference'
      | 'stripPrefix'
      | 'stripCommonPrefix'
      | 'validate'
      | 'urlPrefix'
      | 'urlSuffix'
      | 'ext'
    > {
  /**
   * Filepaths to scan recursively for source and source map files
   */
  include:
    | string
    | SourceMapsPathDescriptor
    | Array<string | SourceMapsPathDescriptor>

  /**
   * Filepaths to ignore when scanning for sources and source maps
   */
  ignore?: string | string[]

  /**
   * Unique name of a release, must be a string, should uniquely identify your release,
   * defaults to sentry-cli releases propose-version command which should always return the correct version
   * (requires access to git CLI and root directory to be a valid repository).
   */
  release?: string

  /**
   * A filter for entry points that should be processed.
   * By default, the release will be injected into all entry points.
   */
  entries?: string[] | RegExp | ((key: string) => boolean)

  /**
   * Path to Sentry CLI config properties, as described in https://docs.sentry.io/learn/cli/configuration/#properties-files.
   * By default, the config file is looked for upwards from the current path and defaults from ~/.sentryclirc are always loaded.
   */
  configFile?: string

  /**
   * Determines whether processed release should be automatically finalized after artifacts upload.
   * Defaults to `true`.
   */
  finalize?: boolean

  /**
   * Determines whether plugin should be applied not more than once during whole webpack run.
   * Useful when the process is performing multiple builds using the same config.
   * Defaults to `false`.
   */
  runOnce?: boolean

  /**
   * Attempts a dry run (useful for dev environments).
   */
  dryRun?: boolean

  /**
   * Print some useful debug information.
   */
  debug?: boolean

  /**
   * If true, will remove all previously uploaded artifacts from the configured release.
   */
  cleanArtifacts?: boolean

  /**
   * When a CLI error occurs, the plugin will call this function.
   *
   * By default, it will call `invokeErr()`, thereby stopping Webpack
   * compilation. To allow compilation to continue and log a warning instead,
   * set this to
   *   (err, invokeErr, compilation) => {
   *     compilation.warnings.push('Sentry CLI Plugin: ' + err.message)
   *   }
   *
   * Note: `compilation` is typed as `unknown` in order to preserve
   * compatibility with both Webpack 4 and Webpack 5 types, If you need the
   * correct type, in Webpack 4 use `compilation.Compilation` and in Webpack 5
   * use `Compilation`.
   */
  errorHandler?: (
    err: Error,
    invokeErr: () => void,
    compilation: unknown
  ) => void

  /**
   * Adds commits to sentry
   */
  setCommits?: SentryCliCommitsOptions

  /**
   * Creates a new release deployment
   */
  deploy?: SentryCliNewDeployOptions
}

export type Arrayable<T> = T | Array<T>

export type Nullable<T> = T | null | undefined

export type MergeInsertions<T> = T extends object
  ? { [K in keyof T]: MergeInsertions<T[K]> }
  : T

export type DeepMerge<F, S> = MergeInsertions<{
  [K in keyof F | keyof S]: K extends keyof S & keyof F
    ? DeepMerge<F[K], S[K]>
    : K extends keyof S
    ? S[K]
    : K extends keyof F
    ? F[K]
    : never
}>
