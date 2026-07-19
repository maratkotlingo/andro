import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { BadgeTone } from '../shared/ui/styles'
import type { ImportPreview } from '../services/storage'

export type ToastMessage = {
  id: string
  title: string
  description: string
  tone: BadgeTone
}

export type ToastInput = Omit<ToastMessage, 'id'> & {
  id?: string
}

function createToastId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `toast-${Date.now()}-${Math.round(Math.random() * 100_000)}`
}

export const useUiStore = defineStore('ui', () => {
  const toasts = ref<ToastMessage[]>([])
  const pendingImportPreview = ref<ImportPreview | null>(null)

  function notify(input: ToastInput): string {
    const id = input.id ?? createToastId()
    toasts.value.push({
      id,
      title: input.title,
      description: input.description,
      tone: input.tone,
    })
    return id
  }

  function dismiss(id: string): void {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function clear(): void {
    toasts.value = []
  }

  function setImportPreview(preview: ImportPreview | null): void {
    pendingImportPreview.value = preview
  }

  return {
    toasts,
    pendingImportPreview,
    notify,
    dismiss,
    clear,
    setImportPreview,
  }
})
