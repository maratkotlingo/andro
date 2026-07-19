import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { router } from './app/router'
import { usePreferencesStore } from './stores/preferences'
import { useToastStore } from './stores/toast'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)

app.use(pinia)
app.use(router)

const preferences = usePreferencesStore(pinia)
const toast = useToastStore(pinia)

preferences.startThemeSync()

app.config.errorHandler = (error, _instance, info) => {
  const message = error instanceof Error ? error.message : 'Неизвестная ошибка интерфейса'
  toast.notify({
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
