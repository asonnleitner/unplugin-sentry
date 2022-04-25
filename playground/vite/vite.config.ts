import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import SentryPlugin from '../../dist/vite'

export default defineConfig({
  build: {
    sourcemap: true
  },

  plugins: [Inspect(), SentryPlugin()]
})
