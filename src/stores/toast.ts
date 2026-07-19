import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { BadgeTone } from '../shared/ui/styles'

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

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<ToastMessage[]>([])

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

  return {
    toasts,
    notify,
    dismiss,
    clear,
  }
})
