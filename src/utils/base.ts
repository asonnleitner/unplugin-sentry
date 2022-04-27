export const assert = (
  condition: boolean,
  message: string
): asserts condition => {
  if (!condition) throw new Error(message)
}
export const toString = (o: any) => Object.prototype.toString.call(o)
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {}
