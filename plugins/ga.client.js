

export default defineNuxtPlugin((nuxtApp) => {

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-VVECXSJDJP'
  document.head.appendChild(script)

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || []

  function gtag() {
    window.dataLayer.push(arguments)
  }

  // Make globally accessible
  window.gtag = gtag

  // Initial GA setup
  gtag('js', new Date())
  gtag('config', 'G-VVECXSJDJP', { anonymize_ip: true })

  // Auto-track page views for SPA routing
  if (nuxtApp.$router) {
    nuxtApp.$router.afterEach((to) => {
      gtag('config', 'G-VVECXSJDJP', {
        page_path: to.fullPath,
      })
    })
  }

  console.log('[GA] plugin loaded')
})
