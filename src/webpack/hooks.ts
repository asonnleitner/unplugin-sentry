import type { SentryCliPluginOptions } from '../types'
import type { Compiler } from 'webpack'

export const attachAfterCodeGenerationHook = (
  compiler: Compiler,
  pluginOptions: SentryCliPluginOptions,
  releasePromise: Promise<string>
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

  const moduleFederationPlugin =
    compiler.options &&
    compiler.options.plugins &&
    compiler.options.plugins.find(
      (x) => x.constructor.name === 'ModuleFederationPlugin'
    )

  if (!moduleFederationPlugin) return

  const { RawSource } = webpackSources

  compiler.hooks.make.tapAsync('SentryCliPlugin', (options, fn) => {
    releasePromise.then((release) => {
      options.hooks.afterCodeGeneration.tap('SentryCliPlugin', () => {
        options.modules.forEach((module) => {
          if (
            (module as any)._name !==
            (moduleFederationPlugin as any)._options.name
          )
            return

          // @ts-ignore
          const sourceMap = options.codeGenerationResults.get(module).sources
          const rawSource = sourceMap.get('javascript')

          if (rawSource) {
            sourceMap.set(
              'javascript',
              new RawSource(
                `${rawSource.source()} 
  (function (){
  var globalThis = (typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {});
  globalThis.SENTRY_RELEASES = globalThis.SENTRY_RELEASES || {};
  globalThis.SENTRY_RELEASES["${pluginOptions.project}@${
                  pluginOptions.org
                }"] = {"id":"${release}"};
  })();`
              )
            )
          }
        })
      })
      fn()
    })
  })
}

export const attachAfterEmitHook = (
  compiler: Compiler,
  callback: (compilation: any, callback: () => any) => void
) => {
  if (compiler.hooks && compiler.hooks.afterEmit) {
    compiler.hooks.afterEmit.tapAsync('SentryCliPlugin', callback)
  } else {
    (compiler as any).plugin('after-emit', callback)
  }
}
