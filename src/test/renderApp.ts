import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, type Pinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import App from '../App.vue'
import { routes } from '../app/router'
import { useSettingsStore } from '../stores/settings'
import {
  configureStorageRuntime,
  createMemoryBrowserStorage,
  createStorageRuntime,
} from '../services/storage'

export type MountedApp = {
  wrapper: VueWrapper
  router: Router
  pinia: Pinia
}

export async function mountApp(path = '/'): Promise<MountedApp> {
  configureStorageRuntime(createStorageRuntime(createMemoryBrowserStorage(), 0))
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)

  const router = createRouter({
    history: createMemoryHistory(),
    routes,
    scrollBehavior: () => ({ top: 0 }),
  })

  const settings = useSettingsStore(pinia)
  settings.startThemeSync()

  await router.push(path)
  await router.isReady()

  const wrapper = mount(App, {
    attachTo: document.body,
    global: {
      plugins: [pinia, router],
    },
  })

  return {
    wrapper,
    router,
    pinia,
  }
}
