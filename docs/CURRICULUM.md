# Kotlin Curriculum Graph

## Принцип графа

Курс строится как dependency graph, а не как плоский список. Тема открывается, когда освоены ее prerequisites. Повторения могут возвращать пользователя к ранним навыкам даже после открытия поздних тем.

## Обозначения

- `id` - стабильный идентификатор темы.
- `dependsOn` - темы, которые должны быть изучены раньше.
- `outcomes` - проверяемые результаты обучения.

## Полный граф тем

| id | Тема | dependsOn | outcomes |
| --- | --- | --- | --- |
| `kotlin.orientation` | Как учиться в приложении | - | Понимает типы проверок, ограничения без runtime, цикл освоения |
| `kotlin.syntax.program-shape` | Форма Kotlin-программы | `kotlin.orientation` | Узнает package, imports, top-level declarations, `main`, комментарии |
| `kotlin.syntax.values` | Значения, `val`, `var`, literals | `kotlin.syntax.program-shape` | Выбирает `val`/`var`, читает literals, избегает лишней изменяемости |
| `kotlin.types.basic` | Базовые типы | `kotlin.syntax.values` | Различает `Int`, `Long`, `Double`, `Boolean`, `Char`, `String` |
| `kotlin.types.inference-conversion` | Type inference и преобразования | `kotlin.types.basic` | Предсказывает выведенный тип, применяет явные conversions |
| `kotlin.syntax.strings` | Строки и templates | `kotlin.types.basic` | Использует `$name`, `${expr}`, raw strings, escaping |
| `kotlin.control.expressions` | Expressions vs statements | `kotlin.types.inference-conversion` | Использует `if`, `when`, `try` как expressions |
| `kotlin.control.if-when` | `if` и `when` | `kotlin.control.expressions` | Пишет branches, exhaustive `when`, conditions |
| `kotlin.control.ranges-loops` | Ranges и loops | `kotlin.control.if-when` | Использует `for`, `while`, ranges, progressions |
| `kotlin.control.jump-labels` | `break`, `continue`, labels | `kotlin.control.ranges-loops` | Управляет nested loops и labelled returns |
| `kotlin.functions.basics` | Функции | `kotlin.control.expressions` | Объявляет функции, параметры, return types |
| `kotlin.functions.defaults-named` | Default и named arguments | `kotlin.functions.basics` | Проектирует удобные вызовы без overload explosion |
| `kotlin.functions.single-expression` | Single-expression functions | `kotlin.functions.basics` | Упрощает короткие функции без потери читаемости |
| `kotlin.functions.vararg-local-recursion` | Vararg, local functions, recursion | `kotlin.functions.defaults-named` | Применяет vararg и локальную декомпозицию |
| `kotlin.nullability.basics` | Nullable-типы | `kotlin.types.basic` | Отличает `String` от `String?`, понимает compile-time защиту |
| `kotlin.nullability.smart-casts` | Smart casts | `kotlin.nullability.basics`, `kotlin.control.if-when` | Сужает nullable type через checks |
| `kotlin.nullability.operators` | Safe call, Elvis, not-null assertion | `kotlin.nullability.smart-casts` | Выбирает `?.`, `?:`, избегает лишнего `!!` |
| `kotlin.nullability.platform-pitfalls` | Null safety антипаттерны | `kotlin.nullability.operators` | Находит опасные nullable-паттерны |
| `kotlin.exceptions.basics` | Exceptions и `try` | `kotlin.control.expressions` | Пишет `try/catch/finally`, понимает unchecked exceptions |
| `kotlin.exceptions.throw-nothing` | `throw`, `Nothing`, error paths | `kotlin.exceptions.basics`, `kotlin.nullability.operators` | Использует fail-fast выражения корректно |
| `kotlin.classes.basics` | Классы и instances | `kotlin.functions.basics` | Создает классы, constructors, properties |
| `kotlin.classes.init-constructors` | `init`, primary/secondary constructors | `kotlin.classes.basics` | Управляет инициализацией объекта |
| `kotlin.classes.properties` | Properties, getters, setters, backing fields | `kotlin.classes.init-constructors` | Различает property и field, пишет computed properties |
| `kotlin.classes.visibility` | Visibility modifiers | `kotlin.classes.properties` | Применяет `private`, `internal`, `protected`, `public` |
| `kotlin.oop.inheritance` | Наследование | `kotlin.classes.visibility` | Использует `open`, `final`, override |
| `kotlin.oop.abstract-polymorphism` | Abstract classes и polymorphism | `kotlin.oop.inheritance` | Моделирует shared contracts через abstract members |
| `kotlin.interfaces.basics` | Interfaces | `kotlin.classes.visibility` | Описывает contracts, default methods, properties |
| `kotlin.interfaces.composition` | Композиция через interfaces | `kotlin.interfaces.basics`, `kotlin.oop.abstract-polymorphism` | Выбирает interface вместо inheritance, где уместно |
| `kotlin.data.data-classes` | Data classes | `kotlin.classes.properties` | Использует `copy`, destructuring, equality |
| `kotlin.data.enums` | Enum classes | `kotlin.control.if-when` | Моделирует ограниченный набор значений |
| `kotlin.data.sealed` | Sealed classes/interfaces | `kotlin.data.enums`, `kotlin.oop.abstract-polymorphism` | Моделирует algebraic-like hierarchies и exhaustive `when` |
| `kotlin.objects.object` | `object` declarations | `kotlin.classes.basics` | Создает singleton и anonymous objects |
| `kotlin.objects.companion` | Companion object | `kotlin.objects.object`, `kotlin.classes.basics` | Размещает factories и class-level members |
| `kotlin.delegation.class` | Class delegation | `kotlin.interfaces.composition` | Делегирует реализацию interface |
| `kotlin.delegation.properties` | Property delegation | `kotlin.classes.properties`, `kotlin.objects.object` | Использует `by lazy`, observable-like patterns, custom delegates |
| `kotlin.extensions.functions` | Extension functions | `kotlin.functions.basics`, `kotlin.classes.basics` | Добавляет поведение без наследования |
| `kotlin.extensions.properties` | Extension properties | `kotlin.extensions.functions`, `kotlin.classes.properties` | Пишет computed extension properties без state |
| `kotlin.lambdas.function-types` | Function types и lambdas | `kotlin.functions.basics` | Читает и пишет `(A) -> B`, trailing lambda |
| `kotlin.lambdas.receivers` | Lambdas with receiver | `kotlin.lambdas.function-types`, `kotlin.extensions.functions` | Понимает DSL-like APIs |
| `kotlin.hof.basics` | Higher-order functions | `kotlin.lambdas.function-types` | Передает функции как значения |
| `kotlin.hof.inline` | Inline functions basics | `kotlin.hof.basics` | Понимает зачем нужен `inline`, осторожно с non-local returns |
| `kotlin.scope.let-run-with-apply-also` | Scope functions | `kotlin.nullability.operators`, `kotlin.lambdas.receivers` | Выбирает `let`, `run`, `with`, `apply`, `also` по намерению |
| `kotlin.collections.lists-sets-maps` | Collections basics | `kotlin.lambdas.function-types` | Работает с `List`, `Set`, `Map`, mutable variants |
| `kotlin.collections.operations` | Collection operations | `kotlin.collections.lists-sets-maps`, `kotlin.hof.basics` | Использует `map`, `filter`, `fold`, grouping |
| `kotlin.collections.nulls-results` | Nulls и collections | `kotlin.collections.operations`, `kotlin.nullability.operators` | Применяет `mapNotNull`, `firstOrNull`, safe transformations |
| `kotlin.sequences.basics` | Sequences | `kotlin.collections.operations` | Отличает eager collections от lazy sequences |
| `kotlin.sequences.performance` | Sequence tradeoffs | `kotlin.sequences.basics` | Выбирает sequence только при реальной пользе |
| `kotlin.generics.basics` | Generics | `kotlin.collections.lists-sets-maps`, `kotlin.classes.basics` | Объявляет generic classes/functions |
| `kotlin.generics.constraints` | Generic constraints | `kotlin.generics.basics`, `kotlin.interfaces.basics` | Использует upper bounds и `where` |
| `kotlin.generics.variance` | Variance: `out`, `in`, projections | `kotlin.generics.constraints` | Объясняет producer/consumer, star-projections |
| `kotlin.generics.reified` | Reified type parameters | `kotlin.generics.variance`, `kotlin.hof.inline` | Понимает возможности и границы `reified` |
| `kotlin.functional.immutability` | Functional style: immutability | `kotlin.collections.operations`, `kotlin.data.data-classes` | Проектирует transformations без лишней мутации |
| `kotlin.functional.errors` | Functional error modeling | `kotlin.functional.immutability`, `kotlin.data.sealed`, `kotlin.exceptions.throw-nothing` | Моделирует success/failure через sealed results |
| `kotlin.functional.composition` | Function composition | `kotlin.functional.errors`, `kotlin.hof.basics` | Собирает pipeline из маленьких функций |
| `kotlin.coroutines.suspend` | `suspend` functions | `kotlin.functions.basics` | Отличает suspend от blocking API |
| `kotlin.coroutines.builders` | Coroutine builders | `kotlin.coroutines.suspend` | Узнает `launch`, `async`, `runBlocking` в учебных примерах |
| `kotlin.coroutines.structured` | Structured concurrency | `kotlin.coroutines.builders` | Понимает parent-child jobs и scope ownership |
| `kotlin.coroutines.cancellation` | Cancellation | `kotlin.coroutines.structured`, `kotlin.exceptions.basics` | Пишет cooperative cancellation, не глотает cancellation |
| `kotlin.coroutines.context-dispatchers` | Coroutine context и dispatchers | `kotlin.coroutines.structured` | Различает context elements и dispatchers |
| `kotlin.coroutines.errors` | Error handling in coroutines | `kotlin.coroutines.cancellation`, `kotlin.coroutines.context-dispatchers` | Объясняет propagation, supervisor behavior |
| `kotlin.channels.basics` | Channels | `kotlin.coroutines.structured` | Использует send/receive и закрытие канала в ограниченных задачах |
| `kotlin.channels.patterns` | Channel patterns | `kotlin.channels.basics`, `kotlin.coroutines.cancellation` | Разбирает producer/consumer и backpressure на уровне концептов |
| `kotlin.flow.basics` | Flow basics | `kotlin.coroutines.suspend`, `kotlin.collections.operations` | Отличает cold flow от collections и sequences |
| `kotlin.flow.operators` | Flow operators | `kotlin.flow.basics`, `kotlin.coroutines.context-dispatchers` | Понимает `map`, `filter`, `transform`, `flowOn` |
| `kotlin.flow.errors-completion` | Flow errors and completion | `kotlin.flow.operators`, `kotlin.coroutines.errors` | Использует `catch`, `onCompletion`, cancellation rules |
| `kotlin.flow.state-shared` | StateFlow и SharedFlow | `kotlin.flow.operators`, `kotlin.objects.object` | Отличает state от events, replay и sharing |
| `kotlin.coroutines.testing` | Тестирование coroutine-кода | `kotlin.coroutines.errors`, `kotlin.flow.state-shared` | Понимает test scheduler, virtual time, deterministic tests |
| `kotlin.antipatterns.nullability` | Антипаттерны null safety | `kotlin.nullability.platform-pitfalls` | Исправляет `!!`, nullable overuse, hidden null branches |
| `kotlin.antipatterns.collections` | Антипаттерны collections/sequences | `kotlin.sequences.performance`, `kotlin.functional.immutability` | Исправляет лишние mutable collections и premature sequences |
| `kotlin.antipatterns.oop` | Антипаттерны ООП | `kotlin.interfaces.composition`, `kotlin.data.sealed` | Исправляет inheritance abuse и data class misuse |
| `kotlin.antipatterns.coroutines` | Антипаттерны coroutines/Flow | `kotlin.coroutines.testing`, `kotlin.channels.patterns`, `kotlin.flow.state-shared` | Находит global scope, swallowed cancellation, wrong dispatcher, event/state confusion |
| `kotlin.capstone.cli-model` | Capstone: моделирование домена | `kotlin.functional.errors`, `kotlin.generics.variance`, `kotlin.scope.let-run-with-apply-also` | Собирает типизированную модель и операции над ней |
| `kotlin.capstone.async-model` | Capstone: асинхронный сценарий | `kotlin.antipatterns.coroutines`, `kotlin.capstone.cli-model` | Проектирует coroutine/Flow pipeline и тестирует поведение концептуально |

## Покрытие обязательных областей

Граф покрывает базовый синтаксис, типы, управляющие конструкции, функции, null safety, исключения, классы и ООП, interfaces, data/enum/sealed classes, object/companion object, delegation, extensions, lambdas, higher-order functions, scope functions, collections, sequences, generics и variance, functional style, coroutines, structured concurrency, cancellation, context/dispatchers, error handling, channels, Flow, StateFlow/SharedFlow, testing coroutine code и типичные антипаттерны Kotlin.

## Правила добавления уроков

- Каждый `TopicNode` из графа должен получить минимум один lesson и полный набор упражнений учебного цикла.
- Advanced темы не должны открываться без prerequisites, даже если пользователь ищет их напрямую.
- Review-задания могут ссылаться на несколько ранних `skillIds`.
- Capstone-задания проверяют перенос знаний, но не заменяют упражнения конкретных тем.
