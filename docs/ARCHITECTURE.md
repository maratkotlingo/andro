# Architecture

## Текущая база

Репозиторий является Vite-приложением на Vue 3 и TypeScript. Сейчас есть минимальная точка входа:

- `src/main.ts` - создание приложения и подключение Pinia PersistedState;
- `src/App.vue` - пустой корневой компонент;
- `src/style.css` - импорт Tailwind CSS;
- `vite.config.ts` - Vue plugin и Tailwind Vite plugin.

Это совместимо с целевой архитектурой: можно добавлять маршрутизацию, stores, доменные модули и контент без переписывания существующего кода.

## Целевая структура `src`

```text
src/
  app/                 # bootstrap, router, app-level providers
  pages/               # route-level views without learning business logic
  widgets/             # composed UI blocks for pages
  features/            # user actions: answer exercise, import progress, search
  entities/            # typed UI/domain adapters for topic, lesson, exercise
  domain/              # pure learning, checking, scheduling, curriculum graph
  content/             # versioned Kotlin curriculum modules
  stores/              # Pinia stores and persisted state boundaries
  shared/              # reusable UI, utilities, accessibility helpers
  services/
    storage/           # localStorage adapters, import/export, migrations
    pwa/               # service worker registration when PWA is added
```

Создавай директории по мере появления реальной функциональности. Не добавляй пустую структуру заранее.

## Границы слоев

- UI (`pages`, `widgets`, `features`, `entities`, `shared/ui`) отображает состояние и отправляет события.
- Domain (`domain`) содержит чистые функции: проверка ответов, расчет mastery, расписание повторений, обход графа тем.
- Content (`content`) содержит версионированные учебные данные без Vue-компонентов.
- Stores (`stores`) держат пользовательское состояние, вызывают domain-функции и сохраняются через Pinia PersistedState.
- Services (`services`) работают с внешними по отношению к domain API: `localStorage`, импорт/экспорт файлов, service worker.

Компоненты не должны напрямую менять persisted state в обход stores.

## Состояние и миграции

Persisted state должен иметь форму:

```ts
type PersistedProgress = {
  schemaVersion: number
  contentVersion: string
  userId: 'local'
  topicProgress: Record<string, TopicProgress>
  exerciseAttempts: Record<string, AttemptSummary>
  reviewQueue: ReviewCard[]
  preferences: UserPreferences
}
```

Правила:

- Любое изменение формата состояния повышает `schemaVersion`.
- Миграции выполняются перед использованием store.
- Импорт прогресса валидируется до записи в store.
- Импорт не должен silently терять данные; несовместимость объясняется пользователю.

## Версионирование контента

Каждый набор контента содержит:

- `contentVersion`;
- `schemaVersion`;
- список тем;
- граф зависимостей;
- список уроков и упражнений;
- changelog совместимости, если меняются `id`.

Стабильные `id` обязательны. Удаление или переименование темы требует миграции прогресса.

## Проверка ответов

Проверка реализуется чистыми функциями в `domain/checking`. Она не зависит от Vue, DOM, network, времени или случайности.

Допустимые стратегии:

- `exact` - точное сравнение строк;
- `normalized` - сравнение после нормализации пробелов и допустимого форматирования;
- `token` - сравнение последовательности токенов;
- `structural` - проверка структурных признаков ответа;
- `construct-rule` - обязательные и запрещенные конструкции;
- `known-solution` - набор известных корректных решений;
- `bounded-result` - заранее определенные результаты для ограниченной области ответа.

## Offline-first

- Core-функции не должны требовать network.
- PWA добавляется отдельным этапом через `vite-plugin-pwa`.
- Service worker кеширует shell приложения и versioned content assets.
- При обновлении contentVersion пользовательский прогресс мигрируется или помечается как требующий ручного решения.

## Ленивая загрузка

Лениво загружаются:

- route-level страницы;
- крупные контентные разделы;
- CodeMirror 6;
- локальный поисковый индекс;
- визуализации графа тем, если они тяжелые.

## Зависимости

Уже установлены: Vue, Vite, Pinia, Pinia PersistedState, Tailwind CSS, Reka UI, Lucide Icons.

Дополнительные зависимости добавляй только при реальной необходимости:

- Vue Router - когда появятся маршруты;
- Zod - для runtime-валидации контента и импорта;
- CodeMirror 6 - для редактора кода;
- VueUse - для небольших browser/composition helpers;
- Vitest и Vue Test Utils - для unit/component tests;
- Playwright - для e2e;
- vite-plugin-pwa - для offline-first;
- MiniSearch или аналог - для локального поиска.
