<template>
    
  <div class="flex flex-col border rounded-lg bg-white shadow-sm">
    <div class="flex items-center justify-between px-3 py-2 border-b">
      <span class="font-mono text-sm truncate">{{ name }}</span>
      <button
        @click="$emit('close')"
        class="text-gray-400 hover:text-red-500"
      >
        ✕
      </button>
    </div>

    <pre class="flex-1 p-3 text-xs font-mono overflow-auto bg-gray-50">
{{ formatted }}
    </pre>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  name: string
  content: string
}>()

function formatContent(content: string) {
  try {
    const trimmed = content.trim()
    if (trimmed.startsWith('{')) {
      return JSON.stringify(JSON.parse(trimmed), null, 2)
    }
    if (trimmed.startsWith('<')) {
      return trimmed.replace(/></g, '>\n<')
    }
    return content
  } catch (e: any) {
    return `⚠️ Format error:\n${e.message}`
  }
}

const formatted = computed(() => formatContent(props.content))
</script>
