<template>
  <footer class="text-gray-400 text-center text-sm px-4 py-6">
    <p>
      &copy; {{ currentYear }} formatter-workspace.com
    </p>
  </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>
