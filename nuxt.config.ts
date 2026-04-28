import Aura from '@primevue/themes/aura'

export default defineNuxtConfig({
  css: ['primeicons/primeicons.css'],
  future: { compatibilityVersion: 4 },
  compatibilityDate: '2025-07-15',
  ssr: false,
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@primevue/nuxt-module', '@nuxt/a11y', '@nuxt/eslint'],
  tailwindcss: { config: { darkMode: 'class' } },
  primevue: {
    options: {
      theme: { preset: Aura, options: { darkModeSelector: '.dark' } },
      ripple: true,
    }
  },
  vite: {
    optimizeDeps: {
      include: ['uuid'],
    }
  },
  runtimeConfig: {
    upstashRedisRestUrl: '',
    upstashRedisRestToken: '',
    public: {
      storageKey: 'finance_tracker_data',
    },
  },
  // @ts-expect-error nitro is valid at runtime; type defs lag behind
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