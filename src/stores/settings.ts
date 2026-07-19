import { defineStore } from 'pinia'
import { computed, ref, watch, type WatchStopHandle } from 'vue'
import { createDefaultUserPreferences, SETTINGS_SCHEMA_VERSION } from '../domain/model/defaults'
import type { UserPreferences } from '../domain/model'
import { getStorageRuntime, runtimePiniaStorage, storageKeys } from '../services/storage'
import { migrateUserPreferences } from '../services/storage/migrations'

export type ThemePreference = UserPreferences['theme']
export type ResolvedTheme = 'light' | 'dark'

const mediaQuery = '(prefers-color-scheme: dark)'

function readSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia(mediaQuery).matches ? 'dark' : 'light'
}

function writeDocumentTheme(theme: ResolvedTheme): void {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.dataset.theme = theme
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export const useSettingsStore = defineStore(
  'settings',
  () => {
    const defaults = createDefaultUserPreferences()
    const schemaVersion = ref(SETTINGS_SCHEMA_VERSION)
    const theme = ref<ThemePreference>(defaults.theme)
    const reducedMotion = ref<UserPreferences['reducedMotion']>(defaults.reducedMotion)
    const codeFontSize = ref(defaults.codeFontSize)
    const systemTheme = ref<ResolvedTheme>(readSystemTheme())
    let stopThemeWatch: WatchStopHandle | null = null
    let stopStorageSync: (() => void) | null = null
    let mediaListenerAttached = false

    const resolvedTheme = computed<ResolvedTheme>(() =>
      theme.value === 'system' ? systemTheme.value : theme.value,
    )

    const snapshot = computed<UserPreferences>(() => ({
      schemaVersion: schemaVersion.value,
      theme: theme.value,
      reducedMotion: reducedMotion.value,
      codeFontSize: codeFontSize.value,
    }))

    function applySnapshot(next: UserPreferences): void {
      schemaVersion.value = next.schemaVersion
      theme.value = next.theme
      reducedMotion.value = next.reducedMotion
      codeFontSize.value = next.codeFontSize
    }

    function setTheme(nextTheme: ThemePreference): void {
      theme.value = nextTheme
    }

    function toggleResolvedTheme(): void {
      theme.value = resolvedTheme.value === 'dark' ? 'light' : 'dark'
    }

    function setCodeFontSize(size: number): void {
      codeFontSize.value = Math.min(Math.max(Math.round(size), 12), 22)
    }

    function resetSettings(): void {
      applySnapshot(createDefaultUserPreferences())
      getStorageRuntime().settingsRepository.clear()
    }

    function recoverFromStoredState(input: unknown): void {
      const migrated = migrateUserPreferences(input, new Date().toISOString())
      applySnapshot(migrated.value)
    }

    function startThemeSync(): void {
      if (stopThemeWatch === null) {
        stopThemeWatch = watch(resolvedTheme, writeDocumentTheme, { immediate: true })
      }

      if (mediaListenerAttached || typeof window === 'undefined') {
        return
      }

      const media = window.matchMedia(mediaQuery)
      const updateSystemTheme = (event: MediaQueryListEvent): void => {
        systemTheme.value = event.matches ? 'dark' : 'light'
      }

      media.addEventListener('change', updateSystemTheme)
      mediaListenerAttached = true
    }

    function startStorageSync(): void {
      if (stopStorageSync !== null) {
        return
      }

      stopStorageSync = getStorageRuntime().settingsRepository.subscribe((change) => {
        if (!change.newValue) {
          applySnapshot(createDefaultUserPreferences())
          return
        }

        try {
          recoverFromStoredState(JSON.parse(change.newValue))
        } catch {
          getStorageRuntime().settingsRepository.repair()
          applySnapshot(createDefaultUserPreferences())
        }
      })
    }

    return {
      schemaVersion,
      theme,
      reducedMotion,
      codeFontSize,
      resolvedTheme,
      snapshot,
      applySnapshot,
      setTheme,
      toggleResolvedTheme,
      setCodeFontSize,
      resetSettings,
      recoverFromStoredState,
      startThemeSync,
      startStorageSync,
    }
  },
  {
    persist: {
      key: storageKeys.settings,
      pick: ['schemaVersion', 'theme', 'reducedMotion', 'codeFontSize'],
      storage: runtimePiniaStorage,
    },
  },
)
