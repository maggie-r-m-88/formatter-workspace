<template>
  <div class="ml-4 font-mono text-sm" :class="{ 'opcity-70': searchQuery && !matchesSearch }">
    <!-- Element node -->
    <div v-if="isElement">
      <div class="inline-flex items-center gap-1 mb-1" :data-match-index="myMatchIndex">
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
              nodeDirectlyMatches ? 'text-purple-900 bg-yellow-200 px-1' : 'text-purple-700',
              isCurrentMatch ? 'ring-2 ring-blue-500' : ''
            ]"
            class="font-semibold"
          >&lt;{{ tagName }}&gt;</span>
          <span v-if="hasAttributes" class="text-gray-400 text-xs">
            {{ attributeCount }} attr{{ attributeCount > 1 ? 's' : '' }}
          </span>
          <span v-if="hasChildren" class="text-gray-400 text-xs">
            {{ childCount }} child{{ childCount > 1 ? 'ren' : '' }}
          </span>
        </button>

        <button
          @click="copyNode"
          class="ml-2 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          title="Copy XML"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      <div v-if="expanded" class="ml-4">
        <!-- Attributes -->
        <div v-if="hasAttributes" class="mb-2">
          <div v-for="(attrValue, attrName) in attributes" :key="attrName" class="text-xs">
            <span class="text-orange-600">@{{ attrName }}</span>
            <span class="text-gray-500">=</span>
            <span class="text-green-700">"{{ attrValue }}"</span>
          </div>
        </div>

        <!-- Text content -->
        <div v-if="textContent" class="text-green-700 mb-1">
          "{{ textContent }}"
        </div>

        <!-- Child elements -->
        <XmlNode
          v-for="(child, index) in children"
          :key="index"
          :node="child"
          :depth="depth + 1"
          :initiallyExpanded="initiallyExpanded"
          :searchQuery="searchQuery"
          :currentMatchIndex="currentMatchIndex"
          :matchIndexCounter="matchIndexCounter"
          :onCopy="onCopy"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import XmlNode from './XmlNode.vue'
import { nodeToXml } from '~/lib/xmlParser'

interface XmlNodeData {
  tagName: string
  attributes: Record<string, string>
  children: XmlNodeData[]
  textContent: string
}

const props = withDefaults(defineProps<{
  node: XmlNodeData
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

const isElement = computed(() => !!props.node.tagName)
const tagName = computed(() => props.node.tagName)
const attributes = computed(() => props.node.attributes || {})
const hasAttributes = computed(() => Object.keys(attributes.value).length > 0)
const attributeCount = computed(() => Object.keys(attributes.value).length)
const children = computed(() => props.node.children || [])
const hasChildren = computed(() => children.value.length > 0)
const childCount = computed(() => children.value.length)
const textContent = computed(() => props.node.textContent?.trim() || '')

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

  // Check tag name
  if (props.node.tagName?.toLowerCase().includes(query)) matches = true

  // Check text content
  if (props.node.textContent?.toLowerCase().includes(query)) matches = true

  // Check attributes
  if (props.node.attributes) {
    for (const [key, value] of Object.entries(props.node.attributes)) {
      if (key.toLowerCase().includes(query) || (value as string).toLowerCase().includes(query)) {
        matches = true
        break
      }
    }
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

// Cache for search results to avoid expensive recursive checks on every render
const searchCache = ref<{ query: string; result: boolean } | null>(null)

// Check if this node or any descendant matches (for visibility)
const matchesSearch = computed(() => {
  if (!props.searchQuery) return true

  const query = props.searchQuery.toLowerCase()

  // Use cache if query hasn't changed
  if (searchCache.value && searchCache.value.query === query) {
    return searchCache.value.result
  }

  // Check if this node or any descendant matches
  const result = nodeContainsQuery(props.node, query)

  searchCache.value = { query, result }
  return result
})

// Helper function to check if node or any descendant contains the query
function nodeContainsQuery(node: any, query: string): boolean {
  // Check tag name
  if (node.tagName?.toLowerCase().includes(query)) return true

  // Check text content
  if (node.textContent?.toLowerCase().includes(query)) return true

  // Check attributes
  if (node.attributes) {
    for (const [key, value] of Object.entries(node.attributes)) {
      if (key.toLowerCase().includes(query) || (value as string).toLowerCase().includes(query)) {
        return true
      }
    }
  }

  // Check children recursively
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      if (nodeContainsQuery(child, query)) {
        return true
      }
    }
  }

  return false
}

// Auto-expand if this node or descendants match search
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

async function copyNode() {
  try {
    const xml = nodeToXml(props.node)
    await navigator.clipboard.writeText(xml)
    props.onCopy()
  } catch (e: any) {
    alert(`Failed to copy: ${e.message}`)
  }
}
</script>

