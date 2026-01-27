// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxtjs/google-fonts'
  ],
  tailwindcss: {
    cssPath: '~/assets/css/global.css',
    configPath: 'tailwind.config.js',
  },
  app: {
    head: {
      title: 'Formatter Workspace', // default fallback title
    },
  },
  googleFonts: {
    families: {
      Inter: [400, 500, 600, 700, 800],
      'JetBrains Mono': [400, 500, 600, 700, 800]
    },
    display: 'swap',
    prefetch: true,
    preconnect: true,
    preload: true
  }
})
