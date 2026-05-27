import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    testTimeout: 15000,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['app/composables/**', 'app/stores/**'],
    },
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, 'app'),
    },
  },
})
