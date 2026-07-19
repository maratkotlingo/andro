import type { CheckKind } from '../../content/demoLearning'

export type DemoCheckStatus = 'correct' | 'needs-work'

export type DemoCheckResult = {
  status: DemoCheckStatus
  checkKind: CheckKind
  matched: readonly string[]
  missing: readonly string[]
  feedback: string
}

type DemoRule = {
  required: readonly string[]
  forbidden: readonly string[]
}

const rules: Record<string, DemoRule> = {
  'kotlin-values': {
    required: ['val', 'var'],
    forbidden: ['!!'],
  },
  'diag-val-var': {
    required: ['val'],
    forbidden: ['var'],
  },
  'diag-null': {
    required: ['?:'],
    forbidden: ['!!'],
  },
  'diag-collection': {
    required: ['map'],
    forbidden: ['forEach'],
  },
  'nullable-elvis': {
    required: ['?:'],
    forbidden: ['!!'],
  },
  'data-class-copy': {
    required: ['data', 'class', 'copy'],
    forbidden: ['var'],
  },
  'flow-state-events': {
    required: ['StateFlow'],
    forbidden: ['GlobalScope'],
  },
}

export function tokenizeKotlinLikeAnswer(answer: string): readonly string[] {
  return answer.match(/[A-Za-z_][A-Za-z0-9_]*|!!|\?:|==|!=|[{}():=.,+\-[\]]/g) ?? []
}

export function checkDemoAnswer(
  lessonId: string,
  answer: string,
  checkKind: CheckKind,
): DemoCheckResult {
  const fallbackRule: DemoRule = {
    required: ['val'],
    forbidden: ['!!'],
  }
  const rule = rules[lessonId] ?? fallbackRule
  const tokens = tokenizeKotlinLikeAnswer(answer)
  const tokenSet = new Set(tokens)
  const matched = rule.required.filter((token) => tokenSet.has(token))
  const missing = rule.required.filter((token) => !tokenSet.has(token))
  const forbidden = rule.forbidden.filter((token) => tokenSet.has(token))

  if (missing.length === 0 && forbidden.length === 0) {
    return {
      status: 'correct',
      checkKind,
      matched,
      missing: [],
      feedback: 'Демо-проверка нашла обязательные токены и не нашла запрещенные конструкции.',
    }
  }

  return {
    status: 'needs-work',
    checkKind,
    matched,
    missing: [...missing, ...forbidden.map((token) => `запрещено: ${token}`)],
    feedback:
      'Это не запуск Kotlin: проверка сравнивает ограниченный набор токенов и конструкций для учебного задания.',
  }
}
