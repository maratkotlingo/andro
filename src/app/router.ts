import {
  createRouter,
  createWebHistory,
  type RouteLocationNormalizedLoaded,
  type RouteRecordRaw,
} from 'vue-router'
import { getDemoLesson } from '../content/demoLearning'

declare module 'vue-router' {
  interface RouteMeta {
    title: string
    description: string
    breadcrumb: string
  }
}

const appTitle = 'Andro Kotlin Trainer'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'overview',
    component: () => import('../pages/OverviewPage.vue'),
    meta: {
      title: 'Обзор',
      description: 'Продолжение обучения, ближайшие повторения и состояние текущей сессии.',
      breadcrumb: 'Обзор',
    },
  },
  {
    path: '/onboarding',
    name: 'onboarding',
    component: () => import('../pages/OnboardingPage.vue'),
    meta: {
      title: 'Первоначальная настройка',
      description: 'Локальные предпочтения обучения без регистрации и облачной синхронизации.',
      breadcrumb: 'Настройка',
    },
  },
  {
    path: '/diagnostic',
    name: 'diagnostic',
    component: () => import('../pages/DiagnosticPage.vue'),
    meta: {
      title: 'Входная диагностика',
      description: 'Короткая проверка текущего уровня Kotlin через детерминированные задания.',
      breadcrumb: 'Диагностика',
    },
  },
  {
    path: '/learn',
    name: 'learn',
    component: () => import('../pages/LearnPage.vue'),
    meta: {
      title: 'Карта курса',
      description: 'Граф тем Kotlin с зависимостями, текущими блокировками и повторениями.',
      breadcrumb: 'Карта курса',
    },
  },
  {
    path: '/lesson/:lessonId',
    name: 'lesson',
    component: () => import('../pages/LessonPage.vue'),
    props: (route) => ({ lessonId: String(route.params.lessonId) }),
    meta: {
      title: 'Урок',
      description: 'Прохождение урока с честным типом проверки ответа.',
      breadcrumb: 'Урок',
    },
  },
  {
    path: '/practice',
    name: 'practice',
    component: () => import('../pages/PracticePage.vue'),
    meta: {
      title: 'Целевая практика',
      description: 'Упражнения для закрепления конкретного навыка Kotlin.',
      breadcrumb: 'Практика',
    },
  },
  {
    path: '/review',
    name: 'review',
    component: () => import('../pages/ReviewPage.vue'),
    meta: {
      title: 'Интервальное повторение',
      description: 'Повторение навыков, которые пора восстановить без подсказок.',
      breadcrumb: 'Повторение',
    },
  },
  {
    path: '/skills',
    name: 'skills',
    component: () => import('../pages/SkillsPage.vue'),
    meta: {
      title: 'Граф навыков',
      description: 'Навыки Kotlin, их prerequisites и текущий уровень освоения.',
      breadcrumb: 'Навыки',
    },
  },
  {
    path: '/progress',
    name: 'progress',
    component: () => import('../pages/ProgressPage.vue'),
    meta: {
      title: 'Статистика',
      description: 'Динамика занятий, качество ответов и прогресс по курсу.',
      breadcrumb: 'Статистика',
    },
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('../pages/SearchPage.vue'),
    meta: {
      title: 'Поиск по материалам',
      description: 'Локальный поиск по уже поставляемому учебному контенту.',
      breadcrumb: 'Поиск',
    },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../pages/SettingsPage.vue'),
    meta: {
      title: 'Настройки',
      description: 'Тема, локальное состояние и будущий экспорт прогресса.',
      breadcrumb: 'Настройки',
    },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../pages/AboutPage.vue'),
    meta: {
      title: 'Методология',
      description:
        'Почему тренажер использует активное восстановление и детерминированные проверки.',
      breadcrumb: 'Методология',
    },
  },
  {
    path: '/error',
    name: 'error',
    component: () => import('../pages/ErrorPage.vue'),
    meta: {
      title: 'Ошибка интерфейса',
      description: 'Состояние восстановления после ошибки UI.',
      breadcrumb: 'Ошибка',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../pages/NotFoundPage.vue'),
    meta: {
      title: 'Страница не найдена',
      description: 'Такого маршрута нет в локальном тренажере.',
      breadcrumb: 'Не найдено',
    },
  },
]

function updatePageMeta(route: RouteLocationNormalizedLoaded): void {
  if (typeof document === 'undefined') {
    return
  }

  const lessonTitle =
    route.name === 'lesson' ? getDemoLesson(String(route.params.lessonId)).title : ''
  const title = lessonTitle || route.meta.title
  document.title = `${title} | ${appTitle}`

  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (description) {
    description.content = route.meta.description
  }
}

function focusMainContent(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.setTimeout(() => {
    document.getElementById('main-content')?.focus({ preventScroll: true })
  }, 0)
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.afterEach((to) => {
  updatePageMeta(to)
  focusMainContent()
})

router.onError((error) => {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent('andro:navigation-error', {
      detail: {
        message: error.message,
      },
    }),
  )
})
