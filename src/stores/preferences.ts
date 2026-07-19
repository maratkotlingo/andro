import { defineStore } from 'pinia'
import { computed, ref, watch, type WatchStopHandle } from 'vue'

export type ThemePreference = 'light' | 'dark' | 'system'
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

export const usePreferencesStore = defineStore(
  'preferences',
  () => {
    const schemaVersion = ref(1)
    const theme = ref<ThemePreference>('system')
    const systemTheme = ref<ResolvedTheme>(readSystemTheme())
    let stopThemeWatch: WatchStopHandle | null = null
    let mediaListenerAttached = false

    const resolvedTheme = computed<ResolvedTheme>(() =>
      theme.value === 'system' ? systemTheme.value : theme.value,
    )

    function setTheme(nextTheme: ThemePreference): void {
      theme.value = nextTheme
    }

    function toggleResolvedTheme(): void {
      theme.value = resolvedTheme.value === 'dark' ? 'light' : 'dark'
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

    return {
      schemaVersion,
      theme,
      resolvedTheme,
      setTheme,
      toggleResolvedTheme,
      startThemeSync,
    }
  },
  {
    persist: {
      key: 'andro:preferences',
      pick: ['schemaVersion', 'theme'],
    },
  },
)
