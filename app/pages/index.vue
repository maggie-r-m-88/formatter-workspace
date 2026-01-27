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

    <!-- Header with title and add panel button -->
    <div class="flex items-center justify-between flex-shrink-0">
      <div class="flex items-center gap-4">
        <h1 class="text-lg font-semibold">Formatter Workspace</h1>

        <!-- Panel tabs -->
        <div class="flex gap-2">
          <button
            v-for="(panel, index) in store.panels"
            :key="panel.id"
            @click="store.setActivePanel(panel.id)"
            :class="[
              'px-3 py-1 rounded text-sm transition-colors',
              store.activePanelId === panel.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            ]"
          >
            Panel {{ index + 1 }}
          </button>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-600">{{ store.panelCount }} / 3 panels</span>
        <button
          v-if="store.canAddPanel"
          @click="store.addPanel()"
          class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
          title="Add new panel"
        >
          <span class="text-xl leading-none">+</span>
          <span>Split</span>
        </button>
      </div>
    </div>

    <!-- Panels container -->
    <div class="flex-1 flex gap-4 min-h-0">
      <!-- Each panel -->
      <div
        v-for="panel in store.panels"
        :key="panel.id"
        class="flex-1 flex flex-col min-h-0 min-w-0 bg-white rounded-lg shadow-sm border-2 transition-colors"
        :class="store.activePanelId === panel.id ? 'border-blue-500' : 'border-gray-200'"
        @click="store.setActivePanel(panel.id)"
      >
        <!-- Thin header with close button -->
        <div class="px-3 py-1 border-b flex justify-end items-center flex-shrink-0 bg-gray-50">
          <button
            v-if="store.panelCount > 1"
            @click.stop="store.removePanel(panel.id)"
            class="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded text-sm"
            title="Close panel"
          >
            ✕
          </button>
        </div>

        <!-- Format selector and search -->
        <div class="p-3 border-b flex gap-2 items-center flex-shrink-0">
          <div class="flex gap-2 items-center flex-1">
            <label class="font-medium text-sm">Format:</label>
            <button
              @click.stop="selectFormat('json', panel.id)"
              :class="[
                'px-3 py-1.5 rounded text-sm',
                panel.selectedFormat === 'json'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border hover:bg-gray-50'
              ]"
            >
              JSON
            </button>
            <button
              @click.stop="selectFormat('xml', panel.id)"
              :class="[
                'px-3 py-1.5 rounded text-sm',
                panel.selectedFormat === 'xml'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border hover:bg-gray-50'
              ]"
            >
              XML
            </button>
          </div>

          <!-- Search box - only show in node view -->
          <div v-if="panel.mode === 'tree'" class="flex gap-2 items-center">
            <button
              v-if="panel.activeSearchQuery"
              @click.stop="clearSearch(panel.id)"
              class="px-2 py-1.5 border rounded hover:bg-gray-100 text-sm"
              title="Clear search"
            >
              Clear
            </button>
            <input
              :value="panel.searchInput"
              @input="updatePanelSearchInput(panel.id, ($event.target as HTMLInputElement).value)"
              type="text"
              placeholder="Search..."
              class="px-2 py-1.5 border rounded text-sm w-48"
              @keydown.enter="executeSearch(panel.id)"
            />
            <button
              @click.stop="executeSearch(panel.id)"
              class="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              title="Search (Enter)"
            >
              Search
            </button>
            <div v-if="panel.activeSearchQuery && panel.totalMatches > 0" class="text-xs text-gray-600 whitespace-nowrap">
              {{ panel.currentMatchIndex + 1 }} / {{ panel.totalMatches }}
            </div>
            <button
              v-if="panel.activeSearchQuery && panel.totalMatches > 0"
              @click.stop="findPrevious(panel.id)"
              class="px-2 py-1 border rounded hover:bg-gray-100 text-sm"
              title="Previous match"
            >
              ↑
            </button>
            <button
              v-if="panel.activeSearchQuery && panel.totalMatches > 0"
              @click.stop="findNext(panel.id)"
              class="px-2 py-1 border rounded hover:bg-gray-100 text-sm"
              title="Next match"
            >
              ↓
            </button>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="px-3 py-2 border-b flex gap-2 flex-shrink-0">
          <button
            v-if="panel.mode === 'edit'"
            @click.stop="showTree(panel.id)"
            class="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            Node View
          </button>
          <button
            v-if="panel.mode === 'tree'"
            @click.stop="backToEdit(panel.id)"
            class="px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
          >
            Back to Edit
          </button>
          <button
            v-if="panel.mode === 'edit'"
            @click.stop="prettyPrint(panel.id)"
            class="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Pretty Print
          </button>
        </div>

        <!-- Content area -->
        <div class="flex-1 min-h-0 p-3 flex flex-col">
          <!-- Edit mode -->
          <textarea
            v-if="panel.mode === 'edit'"
            :value="panel.data"
            @input="updatePanelData(panel.id, ($event.target as HTMLInputElement).value)"
            :placeholder="`Paste ${panel.selectedFormat.toUpperCase()} here…`"
            class="flex-1 min-h-0 w-full p-4 border rounded font-mono text-sm resize-none overflow-auto"
            spellcheck="false"
          />

          <!-- Node view -->
          <div
            v-else
            class="flex-1 min-h-0 flex flex-col"
          >
            <!-- Warning for large files -->
            <div v-if="getPanelNodeCount(panel) > 100 && panel.showLargeFileWarning" class="mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm flex-shrink-0 flex items-start justify-between">
              <p class="text-yellow-800">
                ⚠️ Large file detected ({{ getPanelNodeCount(panel).toLocaleString() }} nodes).
                For better performance, nodes deeper than 2 levels are collapsed by default.
              </p>
              <button
                @click.stop="store.updatePanel(panel.id, { showLargeFileWarning: false })"
                class="ml-2 px-2 text-yellow-600 hover:text-yellow-800 text-lg leading-none"
                title="Dismiss"
              >
                ✕
              </button>
            </div>

            <div class="flex-1 min-h-0 overflow-auto bg-white border rounded p-4">
              <div class="min-w-max">
                <JsonNode
                  v-if="panel.selectedFormat === 'json' && panel.parsedJson"
                  label="root"
                  :value="panel.parsedJson"
                  :initiallyExpanded="panel.collapseAll ? false : true"
                  :searchQuery="panel.activeSearchQuery"
                  :currentMatchIndex="panel.currentMatchIndex"
                  :matchIndexCounter="panel.matchIndexCounter"
                  :onCopy="store.triggerToast"
                />
                <XmlNode
                  v-else-if="panel.selectedFormat === 'xml' && panel.parsedXml"
                  :node="panel.parsedXml"
                  :initiallyExpanded="panel.collapseAll ? false : true"
                  :searchQuery="panel.activeSearchQuery"
                  :currentMatchIndex="panel.currentMatchIndex"
                  :matchIndexCounter="panel.matchIndexCounter"
                  :onCopy="store.triggerToast"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, nextTick } from 'vue'
import JsonNode from '~/components/JsonNode.vue'
import XmlNode from '~/components/XmlNode.vue'
import { formatJson, formatXml } from '~/lib/formatters'
import { parseXmlToTree, countXmlNodes } from '~/lib/xmlParser'
import { useFormatterStore } from '~/stores/formatter'
import { storeToRefs } from 'pinia'

const store = useFormatterStore()
const { showToast, toastVisible } = storeToRefs(store)

// Initialize store with first panel
onMounted(() => {
  store.initialize()
})

// Helper functions for updating panel data
function updatePanelData(panelId: string, value: string) {
  store.updatePanel(panelId, { data: value })
}

// Debounce timers for search input (one per panel)
const searchDebounceTimers = new Map<string, number>()

function updatePanelSearchInput(panelId: string, value: string) {
  store.updatePanel(panelId, { searchInput: value })

  // Clear existing timer for this panel
  const existingTimer = searchDebounceTimers.get(panelId)
  if (existingTimer) {
    clearTimeout(existingTimer)
  }

  // Don't auto-execute search - user must click Search button or press Enter
  // This prevents performance issues from searching on every keystroke
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
  const panel = store.panels.find(p => p.id === panelId)
  if (!panel) return

  if (!panel.searchInput.trim()) {
    clearSearch(panelId)
    return
  }

  // Reset the match counter and set search query
  store.updatePanel(panelId, {
    matchIndexCounter: { value: 0 },
    activeSearchQuery: panel.searchInput,
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
  scrollToCurrentMatch(panel.currentMatchIndex)
}

function findPrevious(panelId: string) {
  const panel = store.panels.find(p => p.id === panelId)
  if (!panel || panel.totalMatches === 0) return

  const newIndex = (panel.currentMatchIndex - 1 + panel.totalMatches) % panel.totalMatches
  store.updatePanel(panelId, { currentMatchIndex: newIndex })
  scrollToCurrentMatch(newIndex)
}

function scrollToCurrentMatch(matchIndex: number) {
  // Find the element with the current match index
  nextTick(() => {
    const matchElement = document.querySelector(`[data-match-index="${matchIndex}"]`)
    if (matchElement) {
      matchElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
}

function clearSearch(panelId: string) {
  store.updatePanel(panelId, {
    searchInput: '',
    activeSearchQuery: '',
    currentMatchIndex: 0,
    totalMatches: 0
  })
}
</script>
