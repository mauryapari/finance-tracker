import tailwindcss from '@tailwindcss/vite'
import Aura from '@primevue/themes/aura'

export default defineNuxtConfig({
  css: ['primeicons/primeicons.css', '~/assets/main.css'],
  future: { compatibilityVersion: 4 },
  compatibilityDate: '2025-07-15',
  ssr: false,
  modules: ['@pinia/nuxt', '@primevue/nuxt-module', '@nuxt/a11y', '@nuxt/eslint'],
  primevue: {
    components: {
      include: ['Button', 'Column', 'ColumnGroup', 'DataTable', 'Dialog', 'InputNumber', 'InputText', 'Row', 'Select'],
    },
    options: {
      theme: { preset: Aura, options: { darkModeSelector: '.dark' } },
      ripple: true,
    }
  },
  routeRules: {
    '/api/stock-price':      { cache: { maxAge: 15 } },
    '/api/stock-peak-batch': { cache: { maxAge: 60 * 60 } },
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['uuid'],
    }
  },
  runtimeConfig: {
    upstashRedisRestUrl: '',
    upstashRedisRestToken: '',
    prodStorageKey: '',   // NUXT_PROD_STORAGE_KEY — prod Redis key to seed local data from
    public: {
      storageKey: 'finance_tracker_data',
    },
  },
  nitro: { preset: 'netlify' },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Finance Tracker',
    },
  },
  devtools: { enabled: true },
  devServer: { port: 3010 }
})