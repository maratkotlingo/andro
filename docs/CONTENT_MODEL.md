# Content Model

## Принцип

Учебный контент хранится как типизированные данные, отделенные от UI. Компоненты отображают контент, но не определяют правила освоения темы и не проверяют ответы напрямую.

## Базовые сущности

```ts
type ContentPackage = {
  schemaVersion: number
  contentVersion: string
  topics: TopicNode[]
  lessons: Lesson[]
  exercises: Exercise[]
}

type TopicNode = {
  id: string
  title: string
  summary: string
  prerequisites: string[]
  outcomes: string[]
  lessonIds: string[]
  reviewSkillIds: string[]
}

type Lesson = {
  id: string
  topicId: string
  title: string
  blocks: LessonBlock[]
  exerciseIds: string[]
}
```

`id` должны быть стабильными. Переименование заголовка не должно менять `id`.

## Учебный цикл темы

Каждая тема проходит один и тот же цикл:

1. Минимальное объяснение.
2. Разобранный пример.
3. Сборка кода из частей.
4. Заполнение пропусков.
5. Написание без подсказки.
6. Исправление ошибки.
7. Перенос знания в новый контекст.
8. Интервальное повторение.

## Блоки урока

```ts
type LessonBlock =
  | { kind: 'explanation'; markdown: string }
  | { kind: 'worked-example'; title: string; code: string; annotations: CodeAnnotation[] }
  | { kind: 'contrast'; before: string; after: string; point: string }
  | { kind: 'pitfall'; title: string; code?: string; explanation: string }
  | { kind: 'checkpoint'; exerciseId: string }
```

Блоки объяснения должны быть короткими. Основная глубина достигается через упражнения и повторение.

## Типы упражнений

```ts
type Exercise =
  | AssembleCodeExercise
  | FillBlankExercise
  | WriteCodeExercise
  | DebugCodeExercise
  | TransferExercise
  | ConceptPromptExercise
  | ReviewExercise
```

Обязательные поля любого упражнения:

```ts
type ExerciseBase = {
  id: string
  topicId: string
  skillIds: string[]
  title: string
  prompt: string
  difficulty: 1 | 2 | 3 | 4 | 5
  expectedTimeSeconds: number
  check: CheckSpec
  hints: Hint[]
  explanation: string
}
```

## Стратегии проверки

```ts
type CheckSpec =
  | { kind: 'exact'; expected: string }
  | { kind: 'normalized'; expected: string; options?: NormalizationOptions }
  | { kind: 'token'; expectedTokens: string[]; allowExtraWhitespace: true }
  | { kind: 'structural'; rules: StructuralRule[] }
  | { kind: 'construct-rule'; required: KotlinConstruct[]; forbidden: KotlinConstruct[] }
  | { kind: 'known-solution'; solutions: KnownSolution[] }
  | { kind: 'bounded-result'; cases: BoundedCase[] }
```

Каждая карточка UI должна показывать `check.kind` понятным текстом.

## Подсказки

Подсказки раскрываются постепенно и влияют на mastery:

- первая подсказка напоминает принцип;
- вторая сужает область ответа;
- третья показывает почти готовый фрагмент, но не полный ответ.

Ответ с подсказкой может продвинуть урок, но не должен засчитываться как полное освоение навыка.

## Метаданные навыков

`skillIds` связывают упражнения с измеримыми навыками. Примеры:

- `kotlin.variables.val-var`;
- `kotlin.null-safety.safe-call`;
- `kotlin.coroutines.cancellation`;
- `kotlin.flow.stateflow`.

Один урок может тренировать несколько навыков, но каждая проверка должна иметь главный навык для расписания повторений.

## Контентные правила

- Не добавлять фиктивные тексты и задачи.
- Не смешивать русский учебный текст с англоязычными идентификаторами в заголовках без причины.
- Kotlin-примеры должны быть минимальными, компилируемо выглядящими и педагогически точными.
- Если задача проверяет не весь Kotlin-код, prompt обязан задавать контролируемую область ответа.
- Антипаттерны показывать через ошибочный код и исправление, а не только через описание.
