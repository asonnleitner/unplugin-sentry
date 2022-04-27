import { SENTRY_LOADER, SENTRY_MODULE } from './constants'
import type { SentryCliPluginOptions } from '../types'
import type { Compiler } from 'webpack'
import {
  isArray,
  isFunction,
  isString,
  isRegExp,
  simpleCopy,
  diffArray,
  createLogger
} from '../utils'
import type { UnpluginContextMeta } from 'unplugin'

// get webpack loader name (version independent)
const getLoaderName = (
  entry: Compiler['options']['module']['rules'] & { loader: any } & {
    use: any[]
  }
) => {
  return (
    entry.loader ||
    (entry.use && entry.use[0] && entry.use[0].loader) ||
    '<unknown loader>'
  )
}

const shouldInjectEntry = <T extends string>(
  key: T,
  entries: SentryCliPluginOptions['entries']
) => {
  if (entries === null || entries === undefined) return true
  if (isFunction(entries)) return entries(key)
  if (isRegExp(entries)) return entries.test(key)
  if (isArray(entries)) return entries.includes(key)
  throw new Error(
    'Invalid `entries` option: Must be an array, RegExp or function'
  )
}

const injectEntry = (
  entry: Compiler['options']['entry'],
  sentryModule: string,
  entries: SentryCliPluginOptions['entries']
): Compiler['options']['entry'] => {
  if (!entry) return sentryModule as unknown as Compiler['options']['entry']

  if (isString(entry)) {
    return [sentryModule, entry] as unknown as Compiler['options']['entry']
  }

  if (isArray(entry)) {
    return [sentryModule].concat(
      entry
    ) as unknown as Compiler['options']['entry']
  }

  if (isFunction(entry)) {
    // @ts-ignore
    return () =>
      Promise.resolve(entry()).then((resolvedEntry) =>
        injectEntry(resolvedEntry, sentryModule, entries)
      )
  }

  const clonedEntry = { ...entry }
  Object.keys(clonedEntry)
    .filter((key) => shouldInjectEntry(key, entries))
    .forEach((key) => {
      if (entry[key] && entry[key].import) {
        ;(clonedEntry[key] as any).import = injectEntry(
          entry[key].import as unknown as Compiler['options']['entry'],
          sentryModule,
          entries
        )
      } else {
        ;(clonedEntry[key] as any) = injectEntry(
          entry[key] as unknown as Compiler['options']['entry'],
          sentryModule,
          entries
        )
      }
    })

  return clonedEntry
}

const injectLoader = (
  loaders: any[] | undefined,
  pluginOptions: SentryCliPluginOptions,
  releasePromise: Promise<string>
) => {
  const loader = {
    test: /sentry-webpack\.module\.js$/,
    loader: SENTRY_LOADER,
    options: {
      releasePromise,
      org: pluginOptions.org || process.env.SENTRY_ORG,
      project: pluginOptions.project || process.env.SENTRY_PROJECT
    }
  }

  return (loaders || []).concat(loader)
}

const injectRule = (
  rules: Compiler['options']['module']['rules'],
  pluginOptions: SentryCliPluginOptions,
  releasePromise: Promise<string>
) => {
  const rule = {
    test: /sentry-webpack\.module\.js$/,
    use: [
      {
        loader: SENTRY_LOADER,
        options: {
          releasePromise,
          org: pluginOptions.org || process.env.SENTRY_ORG,
          project: pluginOptions.project || process.env.SENTRY_PROJECT
        }
      }
    ]
  }

  return (rules || []).concat([rule])
}

export const injectRelease = (
  compilerOptions: Compiler['options'],
  pluginOptions: SentryCliPluginOptions,
  releasePromise: Promise<string>
) => {
  const options = compilerOptions || ({} as Compiler['options'])
  options.entry = injectEntry(
    options.entry,
    SENTRY_MODULE,
    pluginOptions.entries
  )

  if ((options.module as any).loader) {
    ;(options.module as any).loaders = injectLoader(
      (options.module as any).loaders,
      pluginOptions,
      releasePromise
    )
  } else {
    options.module.rules = injectRule(
      options.module.rules,
      pluginOptions,
      releasePromise
    )
  }
}

export const injectReleaseWithDebug = (
  compilerOptions: Compiler['options'],
  pluginOptions: SentryCliPluginOptions,
  releasePromise: Promise<string>,
  pluginMeta: UnpluginContextMeta
) => {
  const debugLog = createLogger(pluginOptions, pluginMeta)

  const input = {
    loaders: simpleCopy(
      (compilerOptions.module as any).loaders || compilerOptions.module.rules
    ).map(getLoaderName),
    entry: simpleCopy(compilerOptions.entry)
  }

  injectRelease(compilerOptions, pluginOptions, releasePromise)

  const output = {
    loaders: simpleCopy(
      (compilerOptions.module as any).loaders || compilerOptions.module.rules
    ).map(getLoaderName),
    entry: simpleCopy(compilerOptions.entry)
  }

  const loadersDiff = diffArray(input.loaders, output.loaders)
  const entryDiff = diffArray(input.entry, output.entry)

  debugLog('DEBUG: Injecting release code')
  debugLog('DEBUG: Loaders:', output.loaders)
  debugLog('DEBUG: Added loaders:', loadersDiff.added)
  debugLog('DEBUG: Removed loaders:', loadersDiff.removed)
  debugLog('DEBUG: Entry:', output.entry)
  debugLog('DEBUG: Added entry:', entryDiff.added)
  debugLog('DEBUG: Removed entry:', entryDiff.removed)
}
