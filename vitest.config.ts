import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['app/composables/**', 'app/stores/**'],
    },
  },
  resolve: {
    alias: {
      '~': '/Users/pmaurya/projects/finance-tracker/app',
    },
  },
})
