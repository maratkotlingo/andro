import type { Component } from 'vue'
import {
  ChartColumn,
  ClipboardCheck,
  Dumbbell,
  GraduationCap,
  House,
  Info,
  Map,
  Network,
  Repeat2,
  Search,
  Settings,
  UserCheck,
} from '@lucide/vue'

export type NavigationItem = {
  path: string
  label: string
  description: string
  icon: Component
  match: readonly string[]
}

export const navigationItems = [
  {
    path: '/',
    label: 'Обзор',
    description: 'Продолжение обучения и текущие задачи',
    icon: House,
    match: ['/'],
  },
  {
    path: '/onboarding',
    label: 'Настройка',
    description: 'Локальный профиль и режим обучения',
    icon: UserCheck,
    match: ['/onboarding'],
  },
  {
    path: '/diagnostic',
    label: 'Диагностика',
    description: 'Входная проверка навыков',
    icon: ClipboardCheck,
    match: ['/diagnostic'],
  },
  {
    path: '/learn',
    label: 'Карта курса',
    description: 'Темы Kotlin и зависимости',
    icon: Map,
    match: ['/learn', '/lesson'],
  },
  {
    path: '/practice',
    label: 'Практика',
    description: 'Целевые упражнения',
    icon: Dumbbell,
    match: ['/practice'],
  },
  {
    path: '/review',
    label: 'Повторение',
    description: 'Отложенные карточки',
    icon: Repeat2,
    match: ['/review'],
  },
  {
    path: '/skills',
    label: 'Навыки',
    description: 'Граф освоения',
    icon: Network,
    match: ['/skills'],
  },
  {
    path: '/progress',
    label: 'Статистика',
    description: 'Темп и качество ответов',
    icon: ChartColumn,
    match: ['/progress'],
  },
  {
    path: '/search',
    label: 'Поиск',
    description: 'Локальный поиск по материалам',
    icon: Search,
    match: ['/search'],
  },
  {
    path: '/settings',
    label: 'Настройки',
    description: 'Тема, хранение и экспорт',
    icon: Settings,
    match: ['/settings'],
  },
  {
    path: '/about',
    label: 'Методология',
    description: 'Как работает тренажер',
    icon: Info,
    match: ['/about'],
  },
] as const satisfies readonly NavigationItem[]

export const mobilePrimaryNavigation = [
  navigationItems[0],
  navigationItems[3],
  navigationItems[4],
  navigationItems[5],
  navigationItems[8],
] as const

export const productMark = {
  name: 'Andro',
  description: 'Kotlin trainer',
  icon: GraduationCap,
} as const
