import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import type { ContentRegistry } from '../content/registry'
import { createContentRegistry } from '../content/registry'

export const useContentStore = defineStore('content', () => {
  const registry = shallowRef<ContentRegistry | null>(null)
  const loading = shallowRef(false)
  const error = shallowRef<string | null>(null)

  const ready = computed(() => registry.value !== null)

  async function load(): Promise<void> {
    if (registry.value || loading.value) {
      return
    }

    loading.value = true
    error.value = null
    try {
      registry.value = await createContentRegistry()
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Content registry failed'
      throw caught
    } finally {
      loading.value = false
    }
  }

  return {
    registry,
    loading,
    error,
    ready,
    load,
  }
})
