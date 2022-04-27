import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import SentryPlugin from '../../dist/vite'
import config from '../config'

export default defineConfig({
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        intro: 'const ENVIRONMENT = "production";'
      }
    }
  },

  plugins: [
    Inspect(),
    SentryPlugin({
      ...config
    })
  ],
  define: {
    __BUILD_TIME__: JSON.stringify('just now')
  }
})
