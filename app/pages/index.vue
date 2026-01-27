<template>
  <div class="h-screen flex flex-col p-4 bg-gray-100 gap-4 overflow-hidden relative">
    <!-- Toast notification -->
    <div
      v-if="showToast"
      class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity duration-300"
      :class="{ 'opacity-0': !toastVisible }"
    >
      Copied
    </div>

    <h1 class="text-lg font-semibold flex-shrink-0">Formatter Workspace</h1>

    <!-- Main container -->
    <div class="flex-1 flex flex-col min-h-0">
      <!-- Format selector and search -->
      <div class="mb-3 flex gap-2 items-center flex-shrink-0">
        <div class="flex gap-2 items-center flex-1">
          <label class="font-medium text-sm">Format:</label>
          <button
            @click="selectFormat('json')"
            :class="[
              'px-4 py-2 rounded',
              selectedFormat === 'json'
                ? 'bg-blue-600 text-white'
                : 'bg-white border hover:bg-gray-50'
            ]"
          >
            JSON
          </button>
          <button
            @click="selectFormat('xml')"
            :class="[
              'px-4 py-2 rounded',
              selectedFormat === 'xml'
                ? 'bg-blue-600 text-white'
                : 'bg-white border hover:bg-gray-50'
            ]"
          >
            XML
          </button>
        </div>

        <!-- Search box - only show in node view -->
        <div v-if="mode === 'tree'" class="flex gap-2 items-center">
          <input
            v-model="searchInput"
            type="text"
            placeholder="Search..."
            class="px-3 py-2 border rounded text-sm w-64"
            @keydown.enter="executeSearch"
          />
          <button
            @click="executeSearch"
            class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            title="Search (Enter)"
          >
            Search
          </button>
          <div v-if="activeSearchQuery && totalMatches > 0" class="text-xs text-gray-600 whitespace-nowrap">
            {{ currentMatchIndex + 1 }} / {{ totalMatches }}
          </div>
          <button
            v-if="activeSearchQuery && totalMatches > 0"
            @click="findPrevious"
            class="px-2 py-1 border rounded hover:bg-gray-100 text-sm"
            title="Previous match"
          >
            ↑
          </button>
          <button
            v-if="activeSearchQuery && totalMatches > 0"
            @click="findNext"
            class="px-2 py-1 border rounded hover:bg-gray-100 text-sm"
            title="Next match"
          >
            ↓
          </button>
          <button
            v-if="activeSearchQuery"
            @click="clearSearch"
            class="px-2 py-1 border rounded hover:bg-gray-100 text-sm"
            title="Clear search"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Textarea (input/output) -->
      <textarea
        v-if="mode === 'edit'"
        v-model="data"
        :placeholder="`Paste ${selectedFormat.toUpperCase()} here…`"
        class="flex-1 min-h-0 w-full p-4 border rounded font-mono text-sm resize-none overflow-auto"
        spellcheck="false"
      />

      <!-- Node view -->
      <div
        v-else
        class="flex-1 min-h-0 flex flex-col"
      >
        <!-- Warning for large files -->
        <div v-if="isLargeFile && showLargeFileWarning" class="mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm flex-shrink-0 flex items-start justify-between">
          <p class="text-yellow-800">
            ⚠️ Large file detected ({{ nodeCount.toLocaleString() }} nodes).
            For better performance, nodes deeper than 2 levels are collapsed by default.
          </p>
          <button
            @click="activePanel && store.updatePanel(activePanel.id, { showLargeFileWarning: false })"
            class="ml-2 px-2 text-yellow-600 hover:text-yellow-800 text-lg leading-none"
            title="Dismiss"
          >
            ✕
          </button>
        </div>

        <div class="flex-1 min-h-0 overflow-auto bg-white border rounded p-4">
          <JsonNode
            v-if="selectedFormat === 'json'"
            label="root"
            :value="parsedJson"
            :initiallyExpanded="collapseAll ? false : true"
            :searchQuery="activeSearchQuery"
            :currentMatchIndex="currentMatchIndex"
            :matchIndexCounter="matchIndexCounter"
            :onCopy="store.triggerToast"
          />
          <XmlNode
            v-else-if="selectedFormat === 'xml' && parsedXml"
            :node="parsedXml"
            :initiallyExpanded="collapseAll ? false : true"
            :searchQuery="activeSearchQuery"
            :currentMatchIndex="currentMatchIndex"
            :matchIndexCounter="matchIndexCounter"
            :onCopy="store.triggerToast"
          />
        </div>
      </div>

      <!-- Action buttons -->
      <div class="mt-2 flex gap-2 flex-shrink-0">
        <button
          @click="prettyPrint"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          v-if="mode === 'edit'"
        >
          Pretty Print
        </button>

        <button
          @click="showTree"
          class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          v-if="mode === 'edit'"
        >
          Node View
        </button>

        <button
          @click="backToEdit"
          class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          v-if="mode === 'tree'"
        >
          Back to Edit
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, nextTick } from 'vue'
import JsonNode from '~/components/JsonNode.vue'
import XmlNode from '~/components/XmlNode.vue'
import { formatJson, formatXml } from '~/lib/formatters'
import { parseXmlToTree, countXmlNodes } from '~/lib/xmlParser'
import { useFormatterStore } from '~/stores/formatter'
import { storeToRefs } from 'pinia'

const store = useFormatterStore()
const { showToast, toastVisible, activePanel } = storeToRefs(store)

// Initialize store with first panel
onMounted(() => {
  store.initialize()
})

// Computed properties that reference the active panel
const data = computed({
  get: () => activePanel.value?.data || '',
  set: (value: string) => {
    if (activePanel.value) {
      store.updatePanel(activePanel.value.id, { data: value })
    }
  }
})

const parsedJson = computed(() => activePanel.value?.parsedJson || null)
const parsedXml = computed(() => activePanel.value?.parsedXml || null)
const mode = computed(() => activePanel.value?.mode || 'edit')
const selectedFormat = computed(() => activePanel.value?.selectedFormat || 'json')
const collapseAll = computed(() => activePanel.value?.collapseAll || false)
const showLargeFileWarning = computed(() => activePanel.value?.showLargeFileWarning || true)

const searchInput = computed({
  get: () => activePanel.value?.searchInput || '',
  set: (value: string) => {
    if (activePanel.value) {
      store.updatePanel(activePanel.value.id, { searchInput: value })
    }
  }
})

const activeSearchQuery = computed(() => activePanel.value?.activeSearchQuery || '')
const currentMatchIndex = computed(() => activePanel.value?.currentMatchIndex || 0)
const totalMatches = computed(() => activePanel.value?.totalMatches || 0)
const matchIndexCounter = computed(() => activePanel.value?.matchIndexCounter || { value: 0 })

const nodeCount = computed(() => {
  if (selectedFormat.value === 'json' && parsedJson.value) {
    return countJsonNodes(parsedJson.value)
  } else if (selectedFormat.value === 'xml' && parsedXml.value) {
    return countXmlNodes(parsedXml.value)
  }
  return 0
})

const isLargeFile = computed(() => nodeCount.value > 100)

function countJsonNodes(obj: any): number {
  if (obj === null || typeof obj !== 'object') return 1

  let count = 1
  if (Array.isArray(obj)) {
    for (const item of obj) {
      count += countJsonNodes(item)
    }
  } else {
    for (const value of Object.values(obj)) {
      count += countJsonNodes(value)
    }
  }
  return count
}

function selectFormat(format: 'json' | 'xml') {
  if (activePanel.value) {
    store.updatePanel(activePanel.value.id, { selectedFormat: format })
  }
  clearSearch() // Clear search when switching formats
}

function prettyPrint() {
  try {
    const trimmed = data.value.trim()

    if (selectedFormat.value === 'json') {
      data.value = formatJson(trimmed)
    } else if (selectedFormat.value === 'xml') {
      data.value = formatXml(trimmed)
    }
  } catch (e: any) {
    alert(`Error formatting ${selectedFormat.value.toUpperCase()}: ${e.message}`)
  }
  clearSearch() // Clear search when formatting
}

function showTree() {
  if (!activePanel.value) return

  try {
    let parsed: any = null
    if (selectedFormat.value === 'json') {
      parsed = JSON.parse(data.value)
      store.updatePanel(activePanel.value.id, { parsedJson: parsed, parsedXml: null })
    } else if (selectedFormat.value === 'xml') {
      parsed = parseXmlToTree(data.value)
      store.updatePanel(activePanel.value.id, { parsedXml: parsed, parsedJson: null })
    }

    // Auto-collapse for large files
    // Use nextTick to ensure nodeCount is computed after parsing
    setTimeout(() => {
      if (activePanel.value) {
        store.updatePanel(activePanel.value.id, {
          collapseAll: isLargeFile.value,
          showLargeFileWarning: true,
          mode: 'tree'
        })
      }
    }, 0)
  } catch (e: any) {
    alert(`Invalid ${selectedFormat.value.toUpperCase()} for Node View:\n${e.message}`)
  }
  clearSearch() // Clear search when switching to tree view
}

function backToEdit() {
  if (activePanel.value) {
    store.updatePanel(activePanel.value.id, { mode: 'edit' })
  }
  clearSearch() // Clear search when going back to edit
}

// Search functionality (node view only)
function executeSearch() {
  if (!activePanel.value) return

  if (!searchInput.value.trim()) {
    clearSearch()
    return
  }

  // Reset the match counter and set search query
  store.updatePanel(activePanel.value.id, {
    matchIndexCounter: { value: 0 },
    activeSearchQuery: searchInput.value,
    currentMatchIndex: 0
  })

  // Count matches will be done by the components
  countMatches()
}

function countMatches() {
  if (!activePanel.value) return

  // Count how many nodes match the search query
  let matches = 0

  if (selectedFormat.value === 'json' && parsedJson.value) {
    matches = countJsonMatches(parsedJson.value, activeSearchQuery.value.toLowerCase())
  } else if (selectedFormat.value === 'xml' && parsedXml.value) {
    matches = countXmlMatches(parsedXml.value, activeSearchQuery.value.toLowerCase())
  }

  store.updatePanel(activePanel.value.id, { totalMatches: matches })
}

function countJsonMatches(value: any, query: string): number {
  let count = 0

  // Check if this value matches
  const valueStr = JSON.stringify(value).toLowerCase()
  if (valueStr.includes(query)) {
    // For leaf nodes, count as 1 match
    if (typeof value !== 'object' || value === null) {
      return 1
    }

    // For objects/arrays, count matches in children
    if (Array.isArray(value)) {
      for (const item of value) {
        count += countJsonMatches(item, query)
      }
    } else {
      for (const [key, val] of Object.entries(value)) {
        if (key.toLowerCase().includes(query)) count++
        count += countJsonMatches(val, query)
      }
    }
  }

  return count
}

function countXmlMatches(node: any, query: string): number {
  let count = 0

  // Check tag name
  if (node.tagName?.toLowerCase().includes(query)) count++

  // Check text content
  if (node.textContent?.toLowerCase().includes(query)) count++

  // Check attributes
  if (node.attributes) {
    for (const [key, value] of Object.entries(node.attributes)) {
      if (key.toLowerCase().includes(query) || (value as string).toLowerCase().includes(query)) {
        count++
      }
    }
  }

  // Check children
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      count += countXmlMatches(child, query)
    }
  }

  return count
}

function findNext() {
  if (!activePanel.value || totalMatches.value === 0) return
  const newIndex = (currentMatchIndex.value + 1) % totalMatches.value
  store.updatePanel(activePanel.value.id, { currentMatchIndex: newIndex })
  scrollToCurrentMatch()
}

function findPrevious() {
  if (!activePanel.value || totalMatches.value === 0) return
  const newIndex = (currentMatchIndex.value - 1 + totalMatches.value) % totalMatches.value
  store.updatePanel(activePanel.value.id, { currentMatchIndex: newIndex })
  scrollToCurrentMatch()
}

function scrollToCurrentMatch() {
  // Find the element with the current match index
  nextTick(() => {
    const matchElement = document.querySelector(`[data-match-index="${currentMatchIndex.value}"]`)
    if (matchElement) {
      matchElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
}

function clearSearch() {
  if (!activePanel.value) return
  store.updatePanel(activePanel.value.id, {
    searchInput: '',
    activeSearchQuery: '',
    currentMatchIndex: 0,
    totalMatches: 0
  })
}
</script>
