import type { Compiler, WebpackPluginInstance, Module } from 'webpack'

export const isArray = Array.isArray
export const toArray = (v: any) => (isArray(v) ? v : [v])

export const ensureKeyValue = (obj: any, key: string, fn: () => any) => {
  obj[key] = typeof obj[key] === 'undefined' ? obj[key] : fn()
  return obj[key]
}

export const deepCopy = (obj: any) =>
  typeof obj === 'object' ? JSON.parse(JSON.stringify(obj)) : obj

export const diffArray = (prev: any, next: any) => {
  prev = toArray(prev)
  next = toArray(next)
  const removed = prev.filter((v: any[]) => !next.includes(v))
  const added = next.filter((v: any[]) => !prev.includes(v))
  return { removed, added }
}

export const getLoaderName = (entry: any) =>
  entry.loader ||
  (entry.use && entry.use[0] && entry.use[0].loader) ||
  '<unknown loader>'

// backward compatibility of `compiler.plugin.afterEmit.tapAsync`
export const attachAfterEmitHook = (
  compiler: Compiler,
  fn: (compilation: any, fn: () => void) => void
) => {
  if (compiler.hooks && compiler.hooks.afterEmit) {
    compiler.hooks.afterEmit.tapAsync('SentryCliPlugin', fn)
  } else {
    ;(compiler as any).plugin('after-emit', fn)
  }
}

export const attachAfterCodeGenerationHook = (
  compiler: Compiler,
  options: {
    releasePromise: () => Promise<string>
    org: string
    project: string
  }
) => {
  if (!compiler.hooks || !compiler.hooks.make) return

  let webpackSources
  try {
    webpackSources = require('webpack-sources')
  } catch (err) {
    console.warn(
      'Could not resolve webpack-sources. Skipping injection for the remote entry file.'
    )
    return
  }

  const moduleFederationPlugin: WebpackPluginInstance | undefined =
    compiler.options &&
    compiler.options.plugins &&
    compiler.options.plugins.find(
      (plugin: any) => plugin.constructor.name === 'ModuleFederationPlugin'
    )

  if (!moduleFederationPlugin) return

  const { RawSource } = webpackSources

  compiler.hooks.make.tapAsync('SentryCliPlugin', async (compilation, fn) => {
    const version = await options.releasePromise()
    compilation.hooks.afterCodeGeneration.tap('SentryCliPlugin', () => {
      compilation.modules.forEach((_module: Module | any) => {
        if (_module._name !== moduleFederationPlugin._options.name) return

        // @ts-ignore
        const sourceMap = compilation.codeGenerationResults.get(_module).sources
        const rawSource = sourceMap.get('javascript')

        if (rawSource) {
          sourceMap.set(
            'javascript',
            new RawSource(
              `${rawSource.source()} 
  (function (){
  var globalThis = (typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {});
  globalThis.SENTRY_RELEASES = globalThis.SENTRY_RELEASES || {};
  globalThis.SENTRY_RELEASES["${options.project}@${
                options.org
              }"] = {"id":"${version}"};
  })();`
            )
          )
        }
      })
    })
    fn()
  })
}
