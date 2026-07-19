import type { BadgeTone } from '../shared/ui/styles'

export type LessonState = 'next' | 'new' | 'review' | 'locked' | 'done'
export type CheckKind =
  | 'exact'
  | 'normalized'
  | 'token'
  | 'structural'
  | 'construct-rule'
  | 'known-solution'
  | 'bounded-result'

export type DemoLesson = {
  id: string
  title: string
  topic: string
  summary: string
  minutes: number
  progress: number
  state: LessonState
  checkKind: CheckKind
  route: string
  code: string
  exercise: string
}

export type DemoSkill = {
  id: string
  label: string
  area: string
  mastery: number
  state: LessonState
  dependsOn: string[]
}

export type DiagnosticQuestion = {
  id: string
  title: string
  prompt: string
  checkKind: CheckKind
}

export type SearchItem = {
  id: string
  title: string
  area: string
  excerpt: string
  route: string
}

export const checkKindLabels: Record<CheckKind, string> = {
  exact: 'точное сравнение',
  normalized: 'нормализация',
  token: 'сравнение токенов',
  structural: 'структурные правила',
  'construct-rule': 'правила конструкций',
  'known-solution': 'известные решения',
  'bounded-result': 'ограниченные результаты',
}

export const stateLabels: Record<LessonState, string> = {
  next: 'продолжить',
  new: 'новый материал',
  review: 'повторение',
  locked: 'закрыто',
  done: 'закреплено',
}

export const stateTones: Record<LessonState, BadgeTone> = {
  next: 'success',
  new: 'new',
  review: 'review',
  locked: 'neutral',
  done: 'success',
}

export const demoLessons = [
  {
    id: 'kotlin-values',
    title: 'val, var и вывод типов',
    topic: 'Базовый синтаксис',
    summary:
      'Короткий вертикальный срез: неизменяемые значения, явные типы и чтение простого Kotlin-кода.',
    minutes: 18,
    progress: 62,
    state: 'next',
    checkKind: 'token',
    route: '/lesson/kotlin-values',
    code: 'val language: String = "Kotlin"\nvar attempts = 1\nattempts += 1',
    exercise:
      'Соберите две строки: неизменяемое имя курса и изменяемый счетчик попыток. Проверка сравнит последовательность ключевых токенов.',
  },
  {
    id: 'nullable-elvis',
    title: 'Nullable-типы и Elvis',
    topic: 'Null safety',
    summary:
      'Тренировка безопасного извлечения значения без `!!` и без имитации запуска программы.',
    minutes: 22,
    progress: 35,
    state: 'review',
    checkKind: 'construct-rule',
    route: '/lesson/nullable-elvis',
    code: 'val displayName = user.name ?: "Anonymous"',
    exercise:
      'Исправьте фрагмент так, чтобы был использован Elvis-оператор, а `!!` был запрещен проверяющим правилом.',
  },
  {
    id: 'data-class-copy',
    title: 'Data class и copy',
    topic: 'Классы и данные',
    summary: 'Перенос состояния через immutable-модель без ручного копирования каждого поля.',
    minutes: 20,
    progress: 0,
    state: 'new',
    checkKind: 'structural',
    route: '/lesson/data-class-copy',
    code: 'data class User(val id: Long, val name: String)\nval renamed = user.copy(name = "Ada")',
    exercise:
      'Напишите `data class` и обновление через `copy`. Проверка ищет структуру объявления и named argument.',
  },
  {
    id: 'flow-state-events',
    title: 'StateFlow против событий',
    topic: 'Coroutines и Flow',
    summary:
      'Поздний раздел курса: отличить состояние экрана от одноразового события и не смешивать их.',
    minutes: 28,
    progress: 0,
    state: 'locked',
    checkKind: 'known-solution',
    route: '/lesson/flow-state-events',
    code: 'private val _state = MutableStateFlow(ScreenState())\nval state = _state.asStateFlow()',
    exercise:
      'Выберите модель для состояния и события. Сейчас раздел закрыт до освоения Flow basics.',
  },
] as const satisfies readonly DemoLesson[]

export const demoSkills = [
  {
    id: 'values',
    label: 'val/var',
    area: 'База',
    mastery: 62,
    state: 'next',
    dependsOn: [],
  },
  {
    id: 'types',
    label: 'Типы',
    area: 'База',
    mastery: 48,
    state: 'new',
    dependsOn: ['values'],
  },
  {
    id: 'null-safety',
    label: 'Null safety',
    area: 'Надежность',
    mastery: 35,
    state: 'review',
    dependsOn: ['types'],
  },
  {
    id: 'data-classes',
    label: 'Data classes',
    area: 'Моделирование',
    mastery: 12,
    state: 'new',
    dependsOn: ['types'],
  },
  {
    id: 'flow',
    label: 'Flow',
    area: 'Асинхронность',
    mastery: 0,
    state: 'locked',
    dependsOn: ['coroutines'],
  },
] as const satisfies readonly DemoSkill[]

export const diagnosticQuestions = [
  {
    id: 'diag-val-var',
    title: 'Изменяемость',
    prompt: 'Какой keyword лучше выбрать для значения, которое не меняется после инициализации?',
    checkKind: 'exact',
  },
  {
    id: 'diag-null',
    title: 'Безопасный fallback',
    prompt: 'Напишите выражение, которое берет `name`, а при null возвращает `"Guest"`.',
    checkKind: 'construct-rule',
  },
  {
    id: 'diag-collection',
    title: 'Преобразование коллекции',
    prompt: 'Как получить список длин строк из `names: List<String>`?',
    checkKind: 'token',
  },
] as const satisfies readonly DiagnosticQuestion[]

export const searchItems = [
  {
    id: 'search-values',
    title: 'Когда `val` лучше `var`',
    area: 'Базовый синтаксис',
    excerpt: 'Неизменяемость делает intent кода яснее и упрощает перенос знаний к data classes.',
    route: '/lesson/kotlin-values',
  },
  {
    id: 'search-elvis',
    title: 'Elvis-оператор',
    area: 'Null safety',
    excerpt: '`?:` задает fallback для nullable-значения и помогает избегать `!!`.',
    route: '/lesson/nullable-elvis',
  },
  {
    id: 'search-flow',
    title: 'StateFlow и SharedFlow',
    area: 'Coroutines',
    excerpt: 'StateFlow хранит состояние, SharedFlow подходит для событий с контролируемым replay.',
    route: '/lesson/flow-state-events',
  },
] as const satisfies readonly SearchItem[]

export function getDemoLesson(lessonId: string): DemoLesson {
  return demoLessons.find((lesson) => lesson.id === lessonId) ?? demoLessons[0]
}

export function getUnlockedLessons(): readonly DemoLesson[] {
  return demoLessons.filter((lesson) => lesson.state !== 'locked')
}

export function getDueReviewLessons(): readonly DemoLesson[] {
  return demoLessons.filter((lesson) => lesson.state === 'review')
}
