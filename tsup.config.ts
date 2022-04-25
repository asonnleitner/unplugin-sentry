import type { Options } from 'tsup'

const tsupConfig: Options = {
  entry: ['src/*.ts'],
  clean: true,
  format: ['cjs', 'esm'],
  dts: true,
  onSuccess: 'pnpm build:fix',
}

export default tsupConfig
