import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { defineComponent, type Component } from 'vue'
import { describe, expect, it } from 'vitest'
import foundationsPackage from '../../../content/sections/foundations'
import { contentPackageSchema, type Exercise } from '../../../domain/model'
import CodeDebuggingExercise from './CodeDebuggingExercise.vue'
import CodeRefactoringExercise from './CodeRefactoringExercise.vue'
import CodeWritingExercise from './CodeWritingExercise.vue'
import ConceptMatchingExercise from './ConceptMatchingExercise.vue'
import ExecutionTracingExercise from './ExecutionTracingExercise.vue'
import ExerciseRenderer from './ExerciseRenderer.vue'
import FillBlanksExercise from './FillBlanksExercise.vue'
import LineParsonsExercise from './LineParsonsExercise.vue'
import MicroParsonsExercise from './MicroParsonsExercise.vue'
import MultipleChoiceExercise from './MultipleChoiceExercise.vue'
import OutputPredictionExercise from './OutputPredictionExercise.vue'
import ProjectStepExercise from './ProjectStepExercise.vue'
import ScenarioTransferExercise from './ScenarioTransferExercise.vue'
import SelfCheckQuestionExercise from './SelfCheckQuestionExercise.vue'
import SingleChoiceExercise from './SingleChoiceExercise.vue'
import TokenOrderingExercise from './TokenOrderingExercise.vue'
import TrueFalseExercise from './TrueFalseExercise.vue'
import TypePredictionExercise from './TypePredictionExercise.vue'
import type { ExerciseSubmitPayload } from './types'

const contentPackage = contentPackageSchema.parse(foundationsPackage)

const KotlinEditorStub = defineComponent({
  name: 'KotlinEditor',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: 'Kotlin',
    },
  },
  emits: ['update:modelValue', 'submit', 'retry'],
  template:
    '<textarea data-testid="kotlin-editor" :aria-label="label" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @keydown.ctrl.enter="$emit(\'submit\')" />',
})

const rendererByKind: Record<Exercise['kind'], Component> = {
  'single-choice': SingleChoiceExercise,
  'multiple-choice': MultipleChoiceExercise,
  'true-false': TrueFalseExercise,
  'token-ordering': TokenOrderingExercise,
  'micro-parsons': MicroParsonsExercise,
  'line-parsons': LineParsonsExercise,
  'fill-in-the-blanks': FillBlanksExercise,
  'output-prediction': OutputPredictionExercise,
  'type-prediction': TypePredictionExercise,
  'code-debugging': CodeDebuggingExercise,
  'code-writing': CodeWritingExercise,
  'code-refactoring': CodeRefactoringExercise,
  'concept-matching': ConceptMatchingExercise,
  'execution-tracing': ExecutionTracingExercise,
  'scenario-based-transfer': ScenarioTransferExercise,
  'project-step': ProjectStepExercise,
  'self-check-question': SelfCheckQuestionExercise,
}

const correctAnswers: Record<Exercise['kind'], unknown> = {
  'single-choice': 'option.val',
  'multiple-choice': ['option.assigned-once', 'option.read-only'],
  'true-false': { value: false, explanation: 'val protects the binding, not object state.' },
  'token-ordering': ['val', 'language', ':', 'String', '=', '"Kotlin"'],
  'micro-parsons': [
    'fragment.counter.declare',
    'fragment.counter.increment',
    'fragment.counter.print',
  ],
  'line-parsons': ['line.user.model', 'line.user.value', 'line.user.copy'],
  'fill-in-the-blanks': { operator: '?:', fallback: 'Guest' },
  'output-prediction': '2',
  'type-prediction': 'String',
  'code-debugging': 'val displayName = user.name ?: "Guest"',
  'code-writing': 'val displayName = name ?: "Guest"',
  'code-refactoring': 'val course = "Kotlin"\nvar attempts = 1\nattempts += 1',
  'concept-matching': {
    'left.val': 'right.readonly-binding',
    'left.var': 'right.mutable-binding',
  },
  'execution-tracing': ['attempts=1', 'attempts=2', 'attempts=4'],
  'scenario-based-transfer': 'displayName uses an Elvis fallback to Guest and avoids !!.',
  'project-step': 'data class Profile with displayName fallback; does not use !!',
  'self-check-question':
    'I choose var when the intent is reassignment and the value needs to change.',
}

describe('exercise renderers', () => {
  it.each(contentPackage.exercises.map((exercise) => [exercise.kind, exercise] as const))(
    'renders %s and submits a checker result',
    async (kind, exercise) => {
      const component = rendererByKind[kind]
      const wrapper = mount(component, {
        props: {
          exercise,
          draft: correctAnswers[kind],
          explanation: 'Explanation text.',
        },
        global: {
          plugins: [createPinia()],
          stubs: {
            KotlinEditor: KotlinEditorStub,
          },
        },
      })

      expect(wrapper.text()).toContain(exercise.title)
      expect(wrapper.text()).toContain(exercise.checker.kind.replaceAll('-', ' '))

      await wrapper.get('form').trigger('submit')

      const emitted = wrapper.emitted('submit')?.[0]?.[0] as ExerciseSubmitPayload | undefined
      expect(emitted?.exerciseId).toBe(exercise.id)
      expect(emitted?.result.passed).toBe(true)
    },
  )

  it('supports progressive hints, solution reveal and next events through ExerciseRenderer', async () => {
    const exercise = contentPackage.exercises[0]
    if (!exercise) {
      throw new Error('Missing exercise fixture')
    }

    const wrapper = mount(ExerciseRenderer, {
      props: {
        exercise,
        draft: correctAnswers[exercise.kind],
      },
      global: {
        plugins: [createPinia()],
        stubs: {
          KotlinEditor: KotlinEditorStub,
        },
      },
    })

    await clickButtonContaining(wrapper, 'Hint')
    expect(wrapper.text()).toContain('Level 1')

    await clickButtonContaining(wrapper, 'Solution')
    expect(wrapper.text()).toContain('val')

    await clickButtonContaining(wrapper, 'Next')
    expect(wrapper.emitted('next')).toHaveLength(1)
  })

  it('renders CodeMirror-backed tasks through the KotlinEditor surface', () => {
    const codeExercise = contentPackage.exercises.find(
      (exercise): exercise is Extract<Exercise, { kind: 'code-writing' }> =>
        exercise.kind === 'code-writing',
    )
    if (!codeExercise) {
      throw new Error('Missing code-writing exercise')
    }

    const wrapper = mount(CodeWritingExercise, {
      props: {
        exercise: codeExercise,
      },
      global: {
        plugins: [createPinia()],
        stubs: {
          KotlinEditor: KotlinEditorStub,
        },
      },
    })

    expect(wrapper.get('[data-testid="kotlin-editor"]').attributes('aria-label')).toBe(
      'Kotlin answer',
    )
  })
})

async function clickButtonContaining(wrapper: VueWrapper, label: string): Promise<void> {
  const button = wrapper.findAll('button').find((item) => item.text().includes(label))
  if (!button) {
    throw new Error(`Button not found: ${label}`)
  }
  await button.trigger('click')
}
