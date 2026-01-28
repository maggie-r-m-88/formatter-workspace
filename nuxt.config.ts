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
      title: 'Formatter Workspace - Multi-Pane JSON & XML Formatter Online',
      meta: [
        { name: 'description', content: 'Formatter Workspace is an online tool to format, visualize, and pretty-print multiple panes of JSON and XML at once with ease.' },
        { name: 'keywords', content: 'JSON formatter, XML formatter, online tool, code editor, pretty print, tree view, multi-pane, split view' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'robots', content: 'index, follow' },
        { property: 'og:title', content: 'Formatter Workspace - Multi-Pane JSON & XML Formatter Online' },
        { property: 'og:description', content: 'Formatter Workspace is an online tool to format, visualize, and pretty-print multiple panes of JSON and XML at once with ease.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://formatter-workspace.com' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Formatter Workspace - Multi-Pane JSON & XML Formatter Online' },
        { name: 'twitter:description', content: 'Format and visualize JSON/XML in multiple panes easily.' },
        { name: 'twitter:image', content: '/og-image.png' }
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }
      ]
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
