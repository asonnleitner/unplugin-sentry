import type { Arrayable, Nullable } from '../types'
import { isArray } from './is'

export const toArray = <T>(array?: Nullable<Arrayable<T>>): Array<T> => {
  array = array || []
  return isArray(array) ? array : [array]
}

export const diffArray = <T>(
  a: T,
  b: T
): {
  removed: Array<T>
  added: Array<T>
} => {
  const aa = toArray(a)
  const bb = toArray(b)
  return {
    removed: aa.filter((x) => !bb.includes(x)),
    added: bb.filter((x) => !aa.includes(x))
  }
}
