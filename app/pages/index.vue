<script setup lang="ts">
import { onMounted, nextTick, reactive, computed } from 'vue'
import JsonNode from '~/components/JsonNode.vue'
import XmlNode from '~/components/XmlNode.vue'
import { formatJson, formatXml } from '~/lib/formatters'
import { parseXmlToTree, countXmlNodes } from '~/lib/xmlParser'
import { useFormatterStore } from '~/stores/formatter'
import { storeToRefs } from 'pinia'
import Logo from '~/components/Logo.vue'

const store = useFormatterStore()
const { showToast, toastVisible } = storeToRefs(store)

const panelGridClass = computed(() => {
  const count = store.panelCount

  if (count === 1) {
    // Always full width
    return 'grid-cols-1'
  }

  if (count === 2) {
    // Stack on mobile, split on md+
    return 'grid-cols-1 md:grid-cols-2'
  }

  // count === 3
  // Cap at 2 on md, allow 3 on lg
  return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
})



// Local search input values (not in store to avoid lag while typing)
const localSearchInputs = reactive<Map<string, string>>(new Map())

// Get local search input for a panel
function getSearchInput(panelId: string): string {
  if (!localSearchInputs.has(panelId)) {
    const panel = store.panels.find(p => p.id === panelId)
    localSearchInputs.set(panelId, panel?.searchInput || '')
  }
  return localSearchInputs.get(panelId) || ''
}

// Update local search input (doesn't update store, so no lag)
function setSearchInput(panelId: string, value: string) {
  localSearchInputs.set(panelId, value)
}

// Initialize store with first panel
onMounted(() => {
  store.initialize()
})

// Helper functions for updating panel data
function updatePanelData(panelId: string, value: string) {
  store.updatePanel(panelId, { data: value })
}



function getPanelNodeCount(panel: any): number {
  if (panel.selectedFormat === 'json' && panel.parsedJson) {
    return countJsonNodes(panel.parsedJson)
  } else if (panel.selectedFormat === 'xml' && panel.parsedXml) {
    return countXmlNodes(panel.parsedXml)
  }
  return 0
}

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

function selectFormat(format: 'json' | 'xml', panelId: string) {
  store.updatePanel(panelId, { selectedFormat: format })
  clearSearch(panelId) // Clear search when switching formats
}

function prettyPrint(panelId: string) {
  const panel = store.panels.find(p => p.id === panelId)
  if (!panel) return

  try {
    const trimmed = panel.data.trim()
    let formatted: string

    if (panel.selectedFormat === 'json') {
      formatted = formatJson(trimmed)
    } else if (panel.selectedFormat === 'xml') {
      formatted = formatXml(trimmed)
    } else {
      return
    }

    store.updatePanel(panelId, { data: formatted })
  } catch (e: any) {
    alert(`Error formatting ${panel.selectedFormat.toUpperCase()}: ${e.message}`)
  }
  clearSearch(panelId) // Clear search when formatting
}

function showTree(panelId: string) {
  const panel = store.panels.find(p => p.id === panelId)
  if (!panel) return

  try {
    let parsed: any = null
    if (panel.selectedFormat === 'json') {
      parsed = JSON.parse(panel.data)
      store.updatePanel(panelId, { parsedJson: parsed, parsedXml: null })
    } else if (panel.selectedFormat === 'xml') {
      parsed = parseXmlToTree(panel.data)
      store.updatePanel(panelId, { parsedXml: parsed, parsedJson: null })
    }

    // Auto-collapse for large files
    setTimeout(() => {
      const updatedPanel = store.panels.find(p => p.id === panelId)
      if (updatedPanel) {
        const nodeCount = getPanelNodeCount(updatedPanel)
        store.updatePanel(panelId, {
          collapseAll: nodeCount > 100,
          showLargeFileWarning: true,
          mode: 'tree'
        })
      }
    }, 0)
  } catch (e: any) {
    alert(`Invalid ${panel.selectedFormat.toUpperCase()} for Node View:\n${e.message}`)
  }
  clearSearch(panelId) // Clear search when switching to tree view
}

function backToEdit(panelId: string) {
  store.updatePanel(panelId, { mode: 'edit' })
  clearSearch(panelId) // Clear search when going back to edit
}

// Search functionality (node view only)
function executeSearch(panelId: string) {
  const searchInput = getSearchInput(panelId)

  if (!searchInput.trim()) {
    clearSearch(panelId)
    return
  }

  // Update store with the search input and reset the match counter
  store.updatePanel(panelId, {
    searchInput: searchInput,
    matchIndexCounter: { value: 0 },
    activeSearchQuery: searchInput,
    currentMatchIndex: 0
  })

  // Count matches will be done by the components
  countMatches(panelId)
}

function countMatches(panelId: string) {
  const panel = store.panels.find(p => p.id === panelId)
  if (!panel) return

  // Count how many nodes match the search query
  let matches = 0

  if (panel.selectedFormat === 'json' && panel.parsedJson) {
    matches = countJsonMatches(panel.parsedJson, panel.activeSearchQuery.toLowerCase())
  } else if (panel.selectedFormat === 'xml' && panel.parsedXml) {
    matches = countXmlMatches(panel.parsedXml, panel.activeSearchQuery.toLowerCase())
  }

  store.updatePanel(panelId, { totalMatches: matches })
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

function findNext(panelId: string) {
  const panel = store.panels.find(p => p.id === panelId)
  if (!panel || panel.totalMatches === 0) return

  const newIndex = (panel.currentMatchIndex + 1) % panel.totalMatches
  store.updatePanel(panelId, { currentMatchIndex: newIndex })
  scrollToCurrentMatch(panelId, newIndex)
}

function findPrevious(panelId: string) {
  const panel = store.panels.find(p => p.id === panelId)
  if (!panel || panel.totalMatches === 0) return

  const newIndex = (panel.currentMatchIndex - 1 + panel.totalMatches) % panel.totalMatches
  store.updatePanel(panelId, { currentMatchIndex: newIndex })
  scrollToCurrentMatch(panelId, newIndex)
}

function scrollToCurrentMatch(panelId: string, matchIndex: number) {
  // Find the element with the current match index within the specific panel
  nextTick(() => {
    // First find the panel element
    const panelElement = document.querySelector(`[data-panel-id="${panelId}"]`)
    if (!panelElement) return

    // Then find the match element within that panel
    const matchElement = panelElement.querySelector(`[data-match-index="${matchIndex}"]`)
    if (matchElement) {
      matchElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
}

function clearSearch(panelId: string) {
  // Clear both local search input and store
  localSearchInputs.set(panelId, '')

  store.updatePanel(panelId, {
    searchInput: '',
    activeSearchQuery: '',
    currentMatchIndex: 0,
    totalMatches: 0
  })
}

function handleSearchKeydown(event: KeyboardEvent, panelId: string) {
  const panel = store.panels.find(p => p.id === panelId)
  if (!panel || !panel.activeSearchQuery || panel.totalMatches === 0) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    findNext(panelId)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    findPrevious(panelId)
  }
}
</script>
<template>
  <div class="h-screen flex flex-col p-4 gap-4 overflow-hidden relative">
    <!-- Toast notification -->
    <div v-if="showToast"
      class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity duration-300"
      :class="{ 'opacity-0': !toastVisible }">
      Copied
    </div>

    <!-- Header with title and add panel button -->
    <div class="flex items-center justify-between flex-shrink-0">
      <div class="flex items-center gap-2">
        <Logo/>


        <!-- Panel tabs -->
        <div class="flex gap-2">
          <!-- <button v-for="(panel, index) in store.panels" :key="panel.id" @click="store.setActivePanel(panel.id)" :class="[
            'px-3 py-1 rounded text-sm transition-colors',
            store.activePanelId === panel.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          ]">
            Panel {{ index + 1 }}
          </button> -->
        </div>
      </div>

      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-400">{{ store.panelCount }} / 3 panels</span>
        <button v-if="store.canAddPanel" @click="store.addPanel()"
          class="px-4 py-2 bg-theme-green-700 text-white rounded hover:bg-theme-green-900 flex items-center gap-2 shadow-[0_2px_4px_rgba(0,0,0,0.22)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.32)] transition-all"
          title="Add new panel">
          <span class="text-xl leading-none">+</span>
          <span>Split</span>
        </button>
      </div>
    </div>

    <!-- Panels container -->
    <div class="flex-1 grid gap-4 min-h-0" :class="panelGridClass">
      <!-- Each panel -->
      <div v-for="panel in store.panels" :key="panel.id"
        :data-panel-id="panel.id"
        class="flex-1 flex flex-col min-h-0 min-w-0 bg-white rounded-md shadow-sm border-2 transition-colors"
        :class="store.activePanelId === panel.id ? 'border-theme-blue-700' : 'border-gray-200'"
        @click="store.setActivePanel(panel.id)">

        <!-- Panel header with format toggle + close button -->
        <div class="pr-3 flex justify-between items-center flex-shrink-0 bg-gray-200 rounded-t-md ">

          <!-- Left: JSON/XML toggle -->
          <div class="inline-flex bg-gray-200 rounded-md">
            <button @click.stop="selectFormat('json', panel.id)" :class="[
              'px-3 py-3 rounded-t text-sm font-medium transition-all flex items-center gap-1.5',
              panel.selectedFormat === 'json'
                ? 'bg-gray-50 text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            ]">
              <span class="font-semibold text-base">{ }</span>
              JSON
            </button>
            <button @click.stop="selectFormat('xml', panel.id)" :class="[
              'px-3 py-1.5 rounded-t text-sm font-medium transition-all flex items-center gap-1.5',
              panel.selectedFormat === 'xml'
                ? 'bg-gray-50 text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            ]">
              <span class="font-semibold text-base">&lt;/&gt;</span>
              XML
            </button>
          </div>
          <!-- Right: Close button -->
          <button v-if="store.panelCount > 1" @click.stop="store.removePanel(panel.id)"
            class="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded text-sm"
            title="Close panel">
            ✕
          </button>
        </div>

        <!-- Action buttons on left, search on right -->
        <div class="px-3 py-3 flex justify-between items-center flex-shrink-0 bg-gray-50 gap-2">

          <!-- Left: Action buttons -->
          <div class="inline-flex items-center gap-2">
            <button v-if="panel.mode === 'edit'" @click.stop="showTree(panel.id)"
              class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:border-gray-400 hover:shadow-sm rounded transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              Node View
            </button>

            <button v-if="panel.mode === 'tree'" @click.stop="backToEdit(panel.id)"
              class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:border-gray-400 hover:shadow-sm rounded transition-all flex items-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span class="hidden xl:inline">Back</span>
            </button>

            <button v-if="panel.mode === 'edit'" @click.stop="prettyPrint(panel.id)"
              class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:border-gray-400 hover:shadow-sm rounded transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              Pretty Print
            </button>
          </div>


          <!-- Right: Search box + navigation -->
          <div v-if="panel.mode === 'tree'" class="inline-flex items-center gap-2">
            <div class="relative">
              <input :value="getSearchInput(panel.id)"
                @input="setSearchInput(panel.id, ($event.target as HTMLInputElement).value)" type="text"
                placeholder="Search..."
                class="px-2 py-1.5 pr-7 border border-gray-300 rounded text-sm w-48 shadow-[0_2px_4px_rgba(0,0,0,0.05)]"
                @keydown.enter="executeSearch(panel.id)"
                @keydown="handleSearchKeydown($event, panel.id)" />
              <button v-if="panel.activeSearchQuery" @click.stop="clearSearch(panel.id)"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                title="Clear search" type="button">
                ✕
              </button>
            </div>

            <button @click.stop="executeSearch(panel.id)"
              class="px-3 py-1.5 bg-theme-blue-600 text-white rounded hover:bg-theme-blue-800 text-sm shadow-[0_1px_3px_rgba(0,0,0,0.12)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.15)] transition-all"
              title="Search (Enter)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            <div v-if="panel.activeSearchQuery && panel.totalMatches > 0"
              class="text-xs text-gray-600 whitespace-nowrap">
              {{ panel.currentMatchIndex + 1 }} / {{ panel.totalMatches }}
            </div>

            <button v-if="panel.activeSearchQuery && panel.totalMatches > 0" @click.stop="findPrevious(panel.id)"
              class="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 hover:shadow-sm text-sm shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all"
              title="Previous match">
              ↑
            </button>

            <button v-if="panel.activeSearchQuery && panel.totalMatches > 0" @click.stop="findNext(panel.id)"
              class="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 hover:shadow-sm text-sm shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all"
              title="Next match">
              ↓
            </button>
          </div>
        </div>


        <!-- Content area -->
        <div class="flex-1 min-h-0 px-3 pb-3 pt-1 flex flex-col bg-gray-50">
          <!-- Edit mode -->
          <textarea v-if="panel.mode === 'edit'" :value="panel.data"
            @input="updatePanelData(panel.id, ($event.target as HTMLInputElement).value)"
            :placeholder="`Paste ${panel.selectedFormat.toUpperCase()} here…`"
            class="flex-1 min-h-0 w-full p-4 border rounded font-mono text-sm resize-none overflow-auto dark:bg-[#222831] dark:text-gray-200"
            spellcheck="false" />

          <!-- Node view -->
          <div v-else class="flex-1 min-h-0 flex flex-col">
            <!-- Warning for large files -->
            <div v-if="getPanelNodeCount(panel) > 100 && panel.showLargeFileWarning"
              class="mb-2 p-3 bg-theme-yellow-50 border border-theme-yellow-200 rounded text-sm flex-shrink-0 flex items-start justify-between">
              <p class="text-theme-yellow-800">
                ⚠️ Large file detected ({{ getPanelNodeCount(panel).toLocaleString() }} nodes).
                For better performance, nodes deeper than 2 levels are collapsed by default.
              </p>
              <button @click.stop="store.updatePanel(panel.id, { showLargeFileWarning: false })"
                class="ml-2 px-2 text-yellow-600 hover:text-yellow-800 text-lg leading-none" title="Dismiss">
                ✕
              </button>
            </div>

            <div class="flex-1 min-h-0 overflow-auto bg-white border rounded p-4 dark:bg-gray-800">
              <div class="min-w-max">
                <JsonNode v-if="panel.selectedFormat === 'json' && panel.parsedJson" label="root"
                  :value="panel.parsedJson" :initiallyExpanded="panel.collapseAll ? false : true"
                  :searchQuery="panel.activeSearchQuery" :currentMatchIndex="panel.currentMatchIndex"
                  :matchIndexCounter="panel.matchIndexCounter" :onCopy="store.triggerToast" />
                <XmlNode v-else-if="panel.selectedFormat === 'xml' && panel.parsedXml" :node="panel.parsedXml"
                  :initiallyExpanded="panel.collapseAll ? false : true" :searchQuery="panel.activeSearchQuery"
                  :currentMatchIndex="panel.currentMatchIndex" :matchIndexCounter="panel.matchIndexCounter"
                  :onCopy="store.triggerToast" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
