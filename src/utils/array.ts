import type { Arrayable, Nullable } from '../types'

export const isArray = Array.isArray

export const toArray = <T>(array?: Nullable<Arrayable<T>>): Array<T> => {
  array = array || []
  return isArray(array) ? array : [array]
}
