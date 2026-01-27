import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { XmlNode as XmlNodeType } from '~/lib/xmlParser'

export interface Panel {
  id: string
  data: string
  parsedJson: any | null
  parsedXml: XmlNodeType | null
  mode: 'edit' | 'tree'
  selectedFormat: 'json' | 'xml'
  collapseAll: boolean
  showLargeFileWarning: boolean
  
  // Search state
  searchInput: string
  activeSearchQuery: string
  currentMatchIndex: number
  totalMatches: number
  matchIndexCounter: { value: number }
}

export const useFormatterStore = defineStore('formatter', () => {
  // Panels state
  const panels = ref<Panel[]>([])
  const activePanelId = ref<string | null>(null)
  
  // Toast notification
  const showToast = ref(false)
  const toastVisible = ref(false)
  
  // Computed
  const activePanel = computed(() => {
    if (!activePanelId.value) return null
    return panels.value.find(p => p.id === activePanelId.value) || null
  })
  
  const panelCount = computed(() => panels.value.length)
  
  const canAddPanel = computed(() => panels.value.length < 3)
  
  // Actions
  function createPanel(): Panel {
    return {
      id: crypto.randomUUID(),
      data: '',
      parsedJson: null,
      parsedXml: null,
      mode: 'edit',
      selectedFormat: 'json',
      collapseAll: false,
      showLargeFileWarning: true,
      searchInput: '',
      activeSearchQuery: '',
      currentMatchIndex: 0,
      totalMatches: 0,
      matchIndexCounter: { value: 0 }
    }
  }
  
  function addPanel() {
    if (!canAddPanel.value) return null
    
    const panel = createPanel()
    panels.value.push(panel)
    activePanelId.value = panel.id
    return panel
  }
  
  function removePanel(panelId: string) {
    const index = panels.value.findIndex(p => p.id === panelId)
    if (index === -1) return
    
    panels.value.splice(index, 1)
    
    // Update active panel
    if (activePanelId.value === panelId) {
      if (panels.value.length > 0) {
        // Set to the previous panel, or the first one if we removed the first
        const newIndex = Math.max(0, index - 1)
        activePanelId.value = panels.value[newIndex]?.id || null
      } else {
        activePanelId.value = null
      }
    }
  }
  
  function setActivePanel(panelId: string) {
    if (panels.value.find(p => p.id === panelId)) {
      activePanelId.value = panelId
    }
  }
  
  function getPanel(panelId: string): Panel | null {
    return panels.value.find(p => p.id === panelId) || null
  }
  
  function updatePanel(panelId: string, updates: Partial<Panel>) {
    const panel = getPanel(panelId)
    if (panel) {
      Object.assign(panel, updates)
    }
  }
  
  // Toast notification
  function triggerToast() {
    showToast.value = true
    toastVisible.value = true
    
    setTimeout(() => {
      toastVisible.value = false
    }, 1500)
    
    setTimeout(() => {
      showToast.value = false
    }, 1800)
  }
  
  // Initialize with one panel
  function initialize() {
    if (panels.value.length === 0) {
      addPanel()
    }
  }
  
  return {
    // State
    panels,
    activePanelId,
    showToast,
    toastVisible,
    
    // Computed
    activePanel,
    panelCount,
    canAddPanel,
    
    // Actions
    addPanel,
    removePanel,
    setActivePanel,
    getPanel,
    updatePanel,
    triggerToast,
    initialize
  }
})

