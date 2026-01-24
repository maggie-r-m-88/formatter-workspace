import { defineStore } from 'pinia'

export interface WorkspaceFile {
  id: string
  name: string
  raw: string
}

export const useWorkspaceStore = defineStore('workspace', {
  state: () => ({
    files: [] as WorkspaceFile[],
    snippetCount: 1,
  }),

  actions: {
    addFile(name: string, raw: string) {
      this.files.push({
        id: crypto.randomUUID(),
        name,
        raw,
      })
    },

    addSnippet(raw: string) {
      this.addFile(`Snippet ${this.snippetCount++}`, raw)
    },

    removeFile(id: string) {
      this.files = this.files.filter(f => f.id !== id)
    },
  },
})
