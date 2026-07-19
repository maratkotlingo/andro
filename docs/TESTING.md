# Testing Strategy

## Доступные проверки сейчас

Текущий `package.json` содержит:

- `npm run dev` - dev server;
- `npm run build` - `vue-tsc -b` и `vite build`;
- `npm run preview` - preview production-сборки.

Отдельных scripts для lint, unit tests и e2e tests пока нет.

Минимальная обязательная проверка для текущего состояния: `npm run build`.

## Typecheck

`npm run build` уже запускает `vue-tsc -b`. Для быстрого typecheck без сборки можно использовать:

```bash
npx vue-tsc -b
```

TypeScript ошибки нельзя закрывать через `any`, кроме редких случаев с документированным обоснованием.

## Unit tests

Когда будет добавлен Vitest, в первую очередь покрыть:

- `domain/checking/normalize`;
- `domain/checking/tokenize`;
- все check strategies;
- `domain/learning/updateMastery`;
- `domain/learning/scheduleReview`;
- `domain/learning/selectNextExercise`;
- `services/storage/migrations`;
- import/export validation.

Domain tests не должны монтировать Vue.

## Component tests

После добавления Vue Test Utils покрыть:

- отображение типа проверки;
- раскрытие подсказок и влияние на состояние;
- feedback panel;
- блокировку завершения темы при невыполненных mastery criteria;
- импорт/экспорт прогресса;
- empty/error states без фиктивных данных.

## E2E tests

После добавления Playwright покрыть:

- первое открытие приложения;
- прохождение одного вертикального среза темы;
- неправильный ответ, подсказка, правильный ответ;
- появление повторения;
- экспорт прогресса;
- импорт прогресса в чистое состояние;
- offline smoke test после первого открытия.

## Content validation

Контент должен проверяться автоматически:

- уникальность `id`;
- существование всех `prerequisites`;
- отсутствие циклов в graph;
- наличие полного учебного цикла для каждой темы;
- валидность `check.kind`;
- наличие объяснения для feedback;
- стабильность `id` между версиями или явная миграция.

## Ручная проверка

Для UI-изменений проверять:

- desktop и mobile viewport;
- keyboard navigation;
- видимый focus;
- отсутствие перекрытия текста;
- честное описание проверки вместо имитации запуска Kotlin.

## Команды будущего качества

Если добавляются инструменты, scripts должны быть стандартными:

```json
{
  "scripts": {
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

После добавления этих scripts обнови `AGENTS.md` и этот документ.
