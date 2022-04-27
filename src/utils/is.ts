import { toString } from './base'

export const isArray = Array.isArray
export const isDef = <T = any>(val?: T): val is T => typeof val !== 'undefined'
export const isBoolean = (val: any): val is boolean => typeof val === 'boolean'
export const isFunction = <T extends Function>(val: any): val is T =>
  typeof val === 'function'
export const isNumber = (val: any): val is number => typeof val === 'number'
export const isString = (val: unknown): val is string => typeof val === 'string'
export const isObject = (val: any): val is object =>
  toString(val) === '[object Object]'

export const isRegExp = (re: unknown): re is RegExp =>
  isObject(re) && toString(re) === '[object RegExp]'
