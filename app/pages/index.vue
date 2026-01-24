<template>
  <div class="h-screen flex flex-col p-4 bg-gray-100 gap-4">
    <h1 class="text-lg font-semibold">Formatter Workspace</h1>

    <!-- Main container -->
    <div class="flex-1 flex flex-col">
      <!-- Textarea (input/output) -->
      <textarea
        v-if="mode === 'edit'"
        v-model="data"
        placeholder="Paste JSON or XML here…"
        class="flex-1 w-full p-4 border rounded font-mono text-sm resize-none overflow-auto"
      />

      <!-- Node view -->
      <div
        v-else
        class="flex-1 overflow-auto bg-white border rounded p-4"
      >
        <JsonNode label="root" :value="parsed" />
      </div>

      <!-- Action buttons -->
      <div class="mt-2 flex gap-2">
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
import { ref } from 'vue'
import JsonNode from '~/components/JsonNode.vue'

const data = ref('')
const parsed = ref<any>(null)
const mode = ref<'edit' | 'tree'>('edit')

function prettyPrint() {
  try {
    const trimmed = data.value.trim()
    if (trimmed.startsWith('{')) {
      data.value = JSON.stringify(JSON.parse(trimmed), null, 2)
    } else if (trimmed.startsWith('<')) {
      data.value = trimmed.replace(/></g, '>\n<')
    } else {
      alert('Unrecognized format')
    }
  } catch (e: any) {
    alert(`Error formatting: ${e.message}`)
  }
}

function showTree() {
  try {
    parsed.value = JSON.parse(data.value)
    mode.value = 'tree'
  } catch (e: any) {
    alert(`Invalid JSON for Node View:\n${e.message}`)
  }
}

function backToEdit() {
  mode.value = 'edit'
}
</script>
