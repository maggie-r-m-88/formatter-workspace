<template>
  <div class="ml-4 font-mono text-sm">
    <!-- Object / Array -->
    <div v-if="isObject">
      <button
        v-if="!isLeaf"
        @click="expanded = !expanded"
        class="inline-flex items-center gap-1 text-gray-700 hover:text-black mb-1 select-none"
      >
        <span class="w-4">{{ expanded ? '▼' : '▶' }}</span>
        <span class="text-blue-700 font-semibold">{{ label }}</span>
        <span class="text-gray-400">
          {{ isArray ? `[${value.length}]` : '{…}' }}
        </span>
      </button>

      <div v-if="expanded || isLeaf" class="ml-4">
        <template v-for="entry in entries">
          <JsonNode
            v-if="!isArray"
            :key="entry.key"
            :label="entry.key"
            :value="entry.value"
          />
          <JsonNode
  v-else
  :key="entry.id || entryIndex(entry)"
  :value="entry.value ?? entry"
/>

        </template>
      </div>
    </div>

    <!-- Leaf -->
    <div v-else>
      <span v-if="label" class="text-blue-700">{{ label }}:</span>
      <span class="ml-1 text-green-700">{{ formatValue(value) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import JsonNode from './JsonNode.vue'

const props = defineProps<{
  label?: string
  value: unknown
}>()

const expanded = ref(true)

const isArray = computed(() => Array.isArray(props.value))
const isObject = computed(
  () => typeof props.value === 'object' && props.value !== null
)
const isLeaf = computed(() => !isObject.value)

const entries = computed(() => {
  if (!isObject.value) return []

  if (isArray.value) {
    // For arrays, just return the values (omit numeric keys)
    return (props.value as unknown[]).map((v) => ({ value: v }))
  }

  // For objects, return key/value pairs
  return Object.entries(props.value as Record<string, unknown>).map(
    ([key, value]) => ({ key, value })
  )
})

function formatValue(v: unknown) {
  if (v === null) return 'null'
  if (typeof v === 'string') return `"${v}"`
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  return String(v)
}

function entryIndex(entry: any) {
  return entry?.id ?? Math.random()
}
</script>
