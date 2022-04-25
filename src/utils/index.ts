// helper function that ensures that an object key is defined. This mutates the object.
import type { Compiler } from 'webpack'
import { deepMerge } from './object'

export const sillyClone = (input: any) => {
  try {
    return JSON.parse(JSON.stringify(input))
  } catch (oO) {
    return undefined
  }
}

export const ensureKey = (obj: any, key: string, factory: () => any) => {
  obj[key] = typeof obj[key] !== 'undefined' ? obj[key] : factory()
  return obj[key]
}

export const getLoaderName = (entry: any) => {
  return (
    entry.loader ||
    (entry.use && entry.use[0] && entry.use[0].loader) ||
    '<unknown loader>'
  )
}

export const injectReleaseWithDebug = (
  compilerOptions: Compiler['options'] & {
    module: { loaders: any }
  }
) => {
  const input = {
    loaders: sillyClone(
      compilerOptions.module.loaders || compilerOptions.module.rules
    ).map(getLoaderName),
    entry: sillyClone(compilerOptions.entry)
  }
}
