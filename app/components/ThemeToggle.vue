<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isDark = ref(false)

function applyTheme(value: boolean) {
  document.documentElement.classList.toggle('dark', value)
}

function toggleTheme() {
  isDark.value = !isDark.value
  applyTheme(isDark.value)
}

onMounted(() => {
  const media = window.matchMedia('(prefers-color-scheme: dark)')

  // Initial value from system
  isDark.value = media.matches
  applyTheme(isDark.value)

  // React to system theme changes
  media.addEventListener('change', (e) => {
    isDark.value = e.matches
    applyTheme(isDark.value)
  })
})
</script>


<template>
  <button
    type="button"
    @click="toggleTheme"
    class="relative w-auto flex items-center justify-center rounded-full transition-colors"
    aria-label="Toggle theme"
  >
    <!-- Sun icon -->
    <svg
      v-show="!isDark"
      class="w-6 h-6 text-theme-yellow-500"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.5"
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>

    <!-- Moon icon -->
    <svg
      v-show="isDark"
      class="w-6 h-6 text-gray-200"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.5"
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  </button>
</template>

<style scoped>
.theme-toggle svg {
  position: absolute;
}
</style>
