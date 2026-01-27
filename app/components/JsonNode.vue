<template>
  <div class="ml-4 font-mono text-sm" :class="{ 'opcity-70': searchQuery && !matchesSearch }">
    <!-- Object / Array -->
    <div v-if="isObject">
      <div v-if="!isLeaf" class="inline-flex items-center gap-1 mb-1" :data-match-index="myMatchIndex">
        <button
          @click="expanded = !expanded"
          :class="[
            'inline-flex items-center gap-1 select-none',
            nodeDirectlyMatches ? 'text-gray-900 font-bold' : 'text-gray-700 hover:text-black'
          ]"
        >
          <span class="w-4">{{ expanded ? '▼' : '▶' }}</span>
          <span
            :class="[
              nodeDirectlyMatches ? 'text-blue-900 bg-yellow-200 px-1' : 'text-blue-700',
              isCurrentMatch ? 'ring-2 ring-blue-500' : ''
            ]"
            class="font-semibold"
          >{{ label }}</span>
          <span class="text-gray-400">
            {{ isArray ? `[${value.length}]` : '{…}' }}
          </span>
        </button>

        <button
          @click="copyNode"
          class="ml-2 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          title="Copy JSON"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      <!-- Only render children if expanded (performance optimization) -->
      <div v-if="expanded" class="ml-4">
        <template v-for="entry in entries">
          <JsonNode
            v-if="!isArray"
            :key="entry.key"
            :label="entry.key"
            :value="entry.value"
            :depth="depth + 1"
            :initiallyExpanded="initiallyExpanded"
            :searchQuery="searchQuery"
            :currentMatchIndex="currentMatchIndex"
            :matchIndexCounter="matchIndexCounter"
            :onCopy="onCopy"
          />
          <JsonNode
            v-else
            :key="entry.id || entryIndex(entry)"
            :value="entry.value ?? entry"
            :depth="depth + 1"
            :initiallyExpanded="initiallyExpanded"
            :searchQuery="searchQuery"
            :currentMatchIndex="currentMatchIndex"
            :matchIndexCounter="matchIndexCounter"
            :onCopy="onCopy"
          />

        </template>
      </div>
    </div>

    <!-- Leaf -->
    <div v-else :data-match-index="myMatchIndex">
      <span
        v-if="label"
        :class="[
          nodeDirectlyMatches ? 'text-blue-900 bg-yellow-200 px-1 font-bold' : 'text-blue-700',
          isCurrentMatch ? 'ring-2 ring-blue-500' : ''
        ]"
      >{{ label }}:</span>
      <span
        class="ml-1"
        :class="[
          nodeDirectlyMatches ? 'text-green-900 bg-yellow-200 px-1 font-bold' : 'text-green-700',
          isCurrentMatch ? 'ring-2 ring-blue-500' : ''
        ]"
      >{{ formatValue(value) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import JsonNode from './JsonNode.vue'

const props = withDefaults(defineProps<{
  label?: string
  value: unknown
  depth?: number
  initiallyExpanded?: boolean
  searchQuery?: string
  currentMatchIndex?: number
  matchIndexCounter?: { value: number }
  onCopy?: () => void
}>(), {
  depth: 0,
  initiallyExpanded: undefined,
  searchQuery: '',
  currentMatchIndex: 0,
  matchIndexCounter: () => ({ value: 0 }),
  onCopy: () => {}
})

// Determine if node should be expanded by default
// If initiallyExpanded is explicitly false, collapse everything
// If initiallyExpanded is explicitly true, expand first 2 levels
// If undefined, expand first 2 levels (default behavior)
const defaultExpanded = computed(() => {
  if (props.initiallyExpanded === false) return false
  if (props.initiallyExpanded === true) return props.depth < 2
  return props.depth < 2
})

const expanded = ref(defaultExpanded.value)

// Search functionality
// Assign a unique match index to this node if it matches
const myMatchIndex = ref<number | null>(null)

// Check if this specific node matches (not descendants)
const nodeDirectlyMatches = computed(() => {
  if (!props.searchQuery) {
    myMatchIndex.value = null
    return false
  }

  const query = props.searchQuery.toLowerCase()
  let matches = false

  // Check if label matches
  if (props.label?.toLowerCase().includes(query)) matches = true

  // For leaf nodes, check the value
  if (!isObject.value) {
    const valueStr = String(props.value).toLowerCase()
    if (valueStr.includes(query)) matches = true
  }

  // Assign match index if this node matches
  if (matches && myMatchIndex.value === null) {
    myMatchIndex.value = props.matchIndexCounter.value++
  } else if (!matches) {
    myMatchIndex.value = null
  }

  return matches
})

// Check if this is the currently selected match
const isCurrentMatch = computed(() => {
  return myMatchIndex.value !== null && myMatchIndex.value === props.currentMatchIndex
})

// Cache for search results to avoid expensive JSON.stringify on every render
const searchCache = ref<{ query: string; result: boolean } | null>(null)

// Check if this node or any descendant matches (for visibility)
const matchesSearch = computed(() => {
  if (!props.searchQuery) return true

  const query = props.searchQuery.toLowerCase()

  // Check if label matches (fast check first)
  if (props.label?.toLowerCase().includes(query)) return true

  // Use cache if query hasn't changed
  if (searchCache.value && searchCache.value.query === query) {
    return searchCache.value.result
  }

  // Check if value (including all descendants) matches
  // This is expensive, so we cache it
  const json = JSON.stringify(props.value).toLowerCase()
  const result = json.includes(query)

  searchCache.value = { query, result }
  return result
})

// Auto-expand if this node or any child matches search
const shouldAutoExpand = computed(() => {
  if (!props.searchQuery) return false
  return matchesSearch.value
})

// Watch for search changes and auto-expand matching nodes
watch(() => props.searchQuery, (newQuery) => {
  if (newQuery && shouldAutoExpand.value) {
    expanded.value = true
  }
}, { immediate: true })

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

async function copyNode() {
  try {
    const json = JSON.stringify(props.value, null, 2)
    await navigator.clipboard.writeText(json)
    props.onCopy()
  } catch (e: any) {
    alert(`Failed to copy: ${e.message}`)
  }
}
</script>
