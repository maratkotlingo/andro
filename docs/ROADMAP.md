# Roadmap

## Этап 0. Репозиторная спецификация

Статус: выполнен этим набором документов.

Результат:

- корневой `AGENTS.md`;
- продуктовая спецификация;
- архитектура;
- модель контента;
- learning engine;
- полный граф тем;
- стратегия тестирования.

## Этап 1. Каркас приложения

Цель: превратить пустой `App.vue` в тонкую оболочку приложения без учебного контента.

Работы:

- добавить Vue Router;
- создать app layout, navigation shell и страницы-заготовки только там, где они сразу используются;
- оформить базовую визуальную систему на Tailwind, Reka UI и Lucide Icons;
- добавить route-level lazy loading;
- не размещать бизнес-логику в компонентах.

Проверка: `npm run build`.

## Этап 2. Domain types и storage

Цель: создать типизированную основу прогресса.

Работы:

- определить domain-типы content/progress;
- создать Pinia stores;
- подключить persisted state;
- добавить `schemaVersion`;
- реализовать миграционный pipeline;
- реализовать экспорт и импорт JSON с валидацией.

Проверка: build; unit tests после подключения Vitest.

## Этап 3. Content infrastructure

Цель: подготовить реальные versioned content packages без массового написания уроков.

Работы:

- описать формат content package;
- добавить runtime-валидацию, при необходимости Zod;
- подключить ленивую загрузку разделов;
- создать малый, но настоящий вертикальный срез одной темы;
- запретить фиктивные карточки и пустой контент.

Проверка: build, content validation tests.

## Этап 4. Checking engine

Цель: реализовать детерминированные проверки ответов.

Работы:

- normalizer;
- tokenizer для учебных Kotlin-like ответов;
- exact, normalized, token, structural, construct-rule, known-solution, bounded-result strategies;
- UI-отображение типа проверки;
- feedback model.

Проверка: unit tests на каждую стратегию и `npm run build`.

## Этап 5. Learning engine

Цель: сделать освоение навыков измеримым.

Работы:

- attempt recording;
- mastery update;
- review scheduling;
- выбор следующего упражнения;
- учет подсказок;
- условия завершения темы.

Проверка: unit tests для mastery и scheduling.

## Этап 6. Учебный интерфейс

Цель: сделать удобный рабочий экран обучения.

Работы:

- lesson reader;
- exercise renderer по типам заданий;
- feedback panel;
- progress indicators;
- review queue;
- keyboard доступность;
- CodeMirror 6, если текстовые ответы с кодом становятся неудобны в textarea.

Проверка: component tests, build, ручная проверка основных потоков.

## Этап 7. Полный курс Kotlin

Цель: постепенно наполнить граф из `CURRICULUM.md` реальным контентом.

Работы:

- писать темы партиями по prerequisites;
- для каждой темы создавать полный учебный цикл;
- добавлять debug и transfer задания;
- поддерживать стабильные `id`;
- обновлять contentVersion и миграции при изменениях.

Проверка: content validation, tests для проверок, build.

## Этап 8. Offline, поиск и polish

Цель: довести приложение до автономного продукта.

Работы:

- добавить `vite-plugin-pwa`;
- кешировать shell и content assets;
- добавить локальный поиск через MiniSearch или аналог;
- улучшить экспорт/импорт;
- проверить мобильные и desktop viewport.

Проверка: build, PWA smoke test, e2e flows.

## Этап 9. Качество и выпуск

Цель: стабилизировать приложение.

Работы:

- добавить Vitest, Vue Test Utils, Playwright;
- зафиксировать lint/format команды;
- покрыть domain и critical UI;
- проверить accessibility;
- проверить recovery после поврежденного localStorage;
- проверить миграции прогресса между contentVersion.

Проверка: полный набор scripts, production preview.

## Правило завершения этапа

Этап нельзя объявлять завершенным, если доступные проверки не запускались. Если часть проверки отсутствует из-за еще не настроенного инструмента, это должно быть явно указано в отчете.
