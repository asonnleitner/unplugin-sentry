import { isObject } from './is'
import type { DeepMerge } from '../types'

const isReadableObject = (item: any): item is Object =>
  isObject(item) && !Array.isArray(item)

export const objectKeys = <T extends object>(obj: T) =>
  Object.keys(obj) as Array<keyof T>

export const deepMerge = <T extends object = object, S extends object = T>(
  target: T,
  ...sources: S[]
): DeepMerge<T, S> => {
  if (!sources.length) return target as any

  const source = sources.shift()
  if (source === undefined) return target as any

  if (isReadableObject(target) && isReadableObject(source)) {
    objectKeys(source).forEach((key) => {
      if (isReadableObject(source[key])) {
        // @ts-expect-error
        if (!target[key])
          // @ts-expect-error
          target[key] = {}

        // @ts-expect-error
        deepMerge(target[key], source[key])
      } else {
        // @ts-expect-error
        target[key] = source[key]
      }
    })
  }

  return deepMerge(target, ...sources)
}
