<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { Menu, Moon, Sun, User } from '@lucide/vue'
import { mobilePrimaryNavigation, productMark } from '../navigation'
import AppBreadcrumbs from './AppBreadcrumbs.vue'
import AppNavigation from './AppNavigation.vue'
import RouteLoading from './RouteLoading.vue'
import SessionIndicator from './SessionIndicator.vue'
import { cx } from '../../shared/lib/cx'
import AppDrawer from '../../shared/ui/AppDrawer.vue'
import AppDropdown from '../../shared/ui/AppDropdown.vue'
import AppIconButton from '../../shared/ui/AppIconButton.vue'
import AppTooltip from '../../shared/ui/AppTooltip.vue'
import { focusRing } from '../../shared/ui/styles'
import type { BreadcrumbItem, DropdownItem } from '../../shared/ui/types'
import { getDemoLesson } from '../../content/demoLearning'
import { usePreferencesStore } from '../../stores/preferences'
import { useToastStore } from '../../stores/toast'

type UiErrorDetail = {
  message: string
}

const route = useRoute()
const router = useRouter()
const preferences = usePreferencesStore()
const toast = useToastStore()
const mobileMenuOpen = ref(false)

const userMenuItems: readonly DropdownItem[] = [
  {
    id: 'theme',
    label: 'Сменить тему',
    description: 'Переключает светлый и темный режим',
  },
  {
    id: 'settings',
    label: 'Открыть настройки',
    description: 'Локальное хранение и интерфейс',
  },
  {
    id: 'about',
    label: 'Методология',
    description: 'Как устроено обучение',
    separatorBefore: true,
  },
]

const breadcrumbs = computed<readonly BreadcrumbItem[]>(() => {
  if (route.path === '/') {
    return []
  }

  if (route.name === 'lesson') {
    const lesson = getDemoLesson(String(route.params.lessonId))
    return [
      { label: 'Обзор', to: '/' },
      { label: 'Карта курса', to: '/learn' },
      { label: lesson.title },
    ]
  }

  return [{ label: 'Обзор', to: '/' }, { label: route.meta.breadcrumb }]
})

const themeLabel = computed(() =>
  preferences.resolvedTheme === 'dark' ? 'Включить светлую тему' : 'Включить темную тему',
)

function handleUserMenuSelect(id: string): void {
  if (id === 'theme') {
    preferences.toggleResolvedTheme()
    toast.notify({
      tone: 'success',
      title: 'Тема обновлена',
      description: `Сейчас активна ${preferences.resolvedTheme === 'dark' ? 'темная' : 'светлая'} тема.`,
    })
    return
  }

  if (id === 'settings') {
    void router.push('/settings')
    return
  }

  if (id === 'about') {
    void router.push('/about')
  }
}

function handleErrorEvent(event: Event): void {
  const detail = (event as CustomEvent<UiErrorDetail>).detail
  toast.notify({
    tone: 'error',
    title: 'Ошибка интерфейса',
    description: detail.message,
  })
}

onMounted(() => {
  window.addEventListener('andro:ui-error', handleErrorEvent)
  window.addEventListener('andro:navigation-error', handleErrorEvent)
})

onUnmounted(() => {
  window.removeEventListener('andro:ui-error', handleErrorEvent)
  window.removeEventListener('andro:navigation-error', handleErrorEvent)
})
</script>

<template>
  <a
    href="#main-content"
    class="fixed left-3 top-3 z-[70] -translate-y-16 rounded-md bg-[var(--color-action)] px-3 py-2 text-sm font-medium text-[var(--color-action-text)] transition-transform focus:translate-y-0"
  >
    Перейти к содержанию
  </a>

  <div class="min-h-dvh bg-[var(--color-bg)] text-[var(--color-text)]">
    <aside
      class="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-[var(--color-border)] bg-[var(--color-sidebar)] p-4 lg:flex"
    >
      <RouterLink
        :to="'/'"
        class="flex items-center gap-3 rounded-md p-2 hover:bg-[var(--color-panel-raised)]"
      >
        <span
          class="grid size-10 place-items-center rounded-lg bg-[var(--color-action)] text-[var(--color-action-text)]"
        >
          <component :is="productMark.icon" class="size-5" aria-hidden="true" />
        </span>
        <span>
          <span class="block text-base font-semibold">{{ productMark.name }}</span>
          <span class="block text-xs text-[var(--color-text-muted)]">{{
            productMark.description
          }}</span>
        </span>
      </RouterLink>

      <div class="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
        <AppNavigation />
      </div>

      <div class="mt-4">
        <SessionIndicator />
      </div>
    </aside>

    <div class="lg:pl-72">
      <header
        class="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg-elevated)]/80"
      >
        <div class="flex min-h-16 items-center gap-2 px-3 sm:px-5 lg:px-8">
          <AppDrawer
            v-model:open="mobileMenuOpen"
            title="Навигация"
            description="Все разделы локального тренажера"
          >
            <template #trigger>
              <AppIconButton label="Открыть навигацию" class="lg:hidden">
                <Menu class="size-5" aria-hidden="true" />
              </AppIconButton>
            </template>
            <AppNavigation @navigate="mobileMenuOpen = false" />
          </AppDrawer>

          <div class="min-w-0 flex-1">
            <AppBreadcrumbs :items="breadcrumbs" />
            <p class="truncate text-sm font-medium text-[var(--color-text)] sm:hidden">
              {{ route.meta.breadcrumb }}
            </p>
          </div>

          <SessionIndicator compact />

          <AppTooltip :text="themeLabel">
            <AppIconButton :label="themeLabel" @click="preferences.toggleResolvedTheme">
              <Sun v-if="preferences.resolvedTheme === 'dark'" class="size-5" aria-hidden="true" />
              <Moon v-else class="size-5" aria-hidden="true" />
            </AppIconButton>
          </AppTooltip>

          <AppDropdown
            label="Локальный профиль"
            :items="userMenuItems"
            @select="handleUserMenuSelect"
          >
            <template #trigger>
              <AppIconButton label="Открыть меню пользователя" variant="secondary">
                <User class="size-5" aria-hidden="true" />
              </AppIconButton>
            </template>
          </AppDropdown>
        </div>
      </header>

      <main
        id="main-content"
        tabindex="-1"
        class="mx-auto min-h-[calc(100dvh-4rem)] max-w-7xl px-3 py-6 outline-none sm:px-5 lg:px-8 lg:py-8"
      >
        <RouterView v-slot="{ Component }">
          <Suspense>
            <component :is="Component" />
            <template #fallback>
              <RouteLoading />
            </template>
          </Suspense>
        </RouterView>
      </main>
    </div>

    <nav
      aria-label="Мобильная навигация"
      class="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-1 py-1 lg:hidden"
    >
      <RouterLink
        v-for="item in mobilePrimaryNavigation"
        :key="item.path"
        :to="item.path"
        :class="
          cx(
            'flex min-w-0 flex-col items-center gap-1 rounded-md px-1 py-2 text-[0.7rem] font-medium',
            focusRing,
            route.path === item.path ||
              item.match.some((match) => route.path.startsWith(`${match}/`))
              ? 'bg-[var(--color-nav-active)] text-[var(--color-text)]'
              : 'text-[var(--color-text-muted)]',
          )
        "
      >
        <component :is="item.icon" class="size-4" aria-hidden="true" />
        <span class="max-w-full truncate">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="h-16 lg:hidden" aria-hidden="true" />
  </div>
</template>
