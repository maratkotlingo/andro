import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DiagnosticResult } from '../domain/model'
import { runtimePiniaStorage, storageKeys } from '../services/storage'

export const useDiagnosticStore = defineStore(
  'diagnostic',
  () => {
    const latestResult = ref<DiagnosticResult | null>(null)

    function saveResult(result: DiagnosticResult): void {
      latestResult.value = result
    }

    function resetDiagnostic(): void {
      latestResult.value = null
    }

    return {
      latestResult,
      saveResult,
      resetDiagnostic,
    }
  },
  {
    persist: {
      key: storageKeys.diagnostic,
      pick: ['latestResult'],
      storage: runtimePiniaStorage,
    },
  },
)
