<script setup>
import Footer from '~/components/Footer.vue'
useHead({
  title: 'Formatter Workspace',
  link: [
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'shortcut icon', href: '/favicon.ico' },
  ],
})
</script>
<template>
  <div class="site-bg">
    <NuxtPage />
    <Footer />
  </div>

</template>
