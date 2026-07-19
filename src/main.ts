import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { router } from './app/router'
import { useSettingsStore } from './stores/settings'
import { useUiStore } from './stores/ui'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)

app.use(pinia)
app.use(router)

const settings = useSettingsStore(pinia)
const ui = useUiStore(pinia)

settings.startThemeSync()
settings.startStorageSync()

app.config.errorHandler = (error, _instance, info) => {
  const message = error instanceof Error ? error.message : 'Неизвестная ошибка интерфейса'
  ui.notify({
    tone: 'error',
    title: 'Ошибка интерфейса',
    description: message,
  })

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('andro:ui-error', {
        detail: { message, info },
      }),
    )
  }
}

app.mount('#app')
