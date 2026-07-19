<script setup lang="ts">
import { indentWithTab } from '@codemirror/commands'
import {
  bracketMatching,
  defaultHighlightStyle,
  indentOnInput,
  indentUnit,
  StreamLanguage,
  syntaxHighlighting,
} from '@codemirror/language'
import { kotlin } from '@codemirror/legacy-modes/mode/clike'
import { EditorState, StateEffect, StateField, type Extension } from '@codemirror/state'
import {
  Decoration,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers as cmLineNumbers,
  rectangularSelection,
  type DecorationSet,
} from '@codemirror/view'
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import type { SourceRange } from '../../domain/checking'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label: string
    readonly?: boolean
    lineNumbers?: boolean
    lineWrapping?: boolean
    dark?: boolean
    errorRanges?: readonly SourceRange[]
    minHeight?: string
  }>(),
  {
    readonly: false,
    lineNumbers: true,
    lineWrapping: true,
    dark: false,
    errorRanges: () => [],
    minHeight: '12rem',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: []
  retry: []
}>()

const setErrorRangesEffect = StateEffect.define<readonly SourceRange[]>()
const errorMark = Decoration.mark({
  class: 'cm-kotlin-error-range',
})

const errorRangeField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none
  },
  update(value, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(setErrorRangesEffect)) {
        return Decoration.set(
          effect.value.map((range) => errorMark.range(range.from, range.to)),
          true,
        )
      }
    }
    return value.map(transaction.changes)
  },
  provide: (field) => EditorView.decorations.from(field),
})

const editorHost = ref<HTMLElement | null>(null)
const view = shallowRef<EditorView | null>(null)
let suppressNextEmit = false

onMounted(() => {
  createEditor()
})

onBeforeUnmount(() => {
  view.value?.destroy()
  view.value = null
})

watch(
  () => props.modelValue,
  (value) => {
    const editor = view.value
    if (!editor || value === editor.state.doc.toString()) {
      return
    }
    suppressNextEmit = true
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: value },
    })
  },
)

watch(
  () => props.errorRanges,
  () => {
    applyErrorRanges()
  },
  { deep: true },
)

watch(
  () => [props.readonly, props.lineNumbers, props.lineWrapping, props.dark, props.label] as const,
  async () => {
    const value = view.value?.state.doc.toString() ?? props.modelValue
    view.value?.destroy()
    view.value = null
    await nextTick()
    createEditor(value)
  },
)

function createEditor(value = props.modelValue): void {
  if (!editorHost.value) {
    return
  }

  view.value = new EditorView({
    parent: editorHost.value,
    state: EditorState.create({
      doc: value,
      extensions: editorExtensions(),
    }),
  })
  applyErrorRanges()
}

function editorExtensions(): readonly Extension[] {
  return [
    props.lineNumbers ? cmLineNumbers() : [],
    props.lineNumbers ? highlightActiveLineGutter() : [],
    drawSelection(),
    dropCursor(),
    rectangularSelection(),
    highlightActiveLine(),
    indentOnInput(),
    bracketMatching(),
    indentUnit.of('  '),
    StreamLanguage.define(kotlin),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    EditorState.tabSize.of(2),
    EditorState.readOnly.of(props.readonly),
    EditorView.editable.of(!props.readonly),
    EditorView.contentAttributes.of({
      'aria-label': props.label,
      spellcheck: 'false',
      autocapitalize: 'off',
      autocomplete: 'off',
    }),
    props.lineWrapping ? EditorView.lineWrapping : [],
    editorTheme(),
    errorRangeField,
    keymap.of([
      {
        key: 'Mod-Enter',
        run: () => {
          emit('submit')
          return true
        },
      },
      {
        key: 'Mod-Shift-r',
        run: () => {
          emit('retry')
          return true
        },
      },
      indentWithTab,
    ]),
    EditorView.updateListener.of((update) => {
      if (!update.docChanged) {
        return
      }
      if (suppressNextEmit) {
        suppressNextEmit = false
        return
      }
      emit('update:modelValue', update.state.doc.toString())
    }),
  ]
}

function editorTheme(): Extension {
  return EditorView.theme(
    {
      '&': {
        minHeight: props.minHeight,
        borderRadius: '0.5rem',
        border: '1px solid var(--color-border-strong)',
        backgroundColor: 'var(--color-input)',
        color: 'var(--color-text)',
        fontSize: '0.875rem',
        overflow: 'hidden',
      },
      '&.cm-focused': {
        outline: '2px solid var(--color-focus)',
        outlineOffset: '2px',
      },
      '.cm-scroller': {
        minHeight: props.minHeight,
        fontFamily: 'JetBrains Mono, SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace',
        lineHeight: '1.6',
      },
      '.cm-content': {
        padding: '0.75rem 0',
        caretColor: 'var(--color-action)',
      },
      '.cm-line': {
        padding: '0 0.875rem',
      },
      '.cm-gutters': {
        backgroundColor: 'var(--color-panel-raised)',
        color: 'var(--color-text-subtle)',
        borderRight: '1px solid var(--color-border)',
      },
      '.cm-activeLineGutter, .cm-activeLine': {
        backgroundColor: 'color-mix(in srgb, var(--color-action) 9%, transparent)',
      },
      '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
        backgroundColor: 'color-mix(in srgb, var(--color-action) 22%, transparent)',
      },
      '.cm-kotlin-error-range': {
        backgroundColor: 'color-mix(in srgb, var(--color-error-text) 18%, transparent)',
        borderBottom: '2px solid var(--color-error-text)',
      },
    },
    { dark: props.dark },
  )
}

function applyErrorRanges(): void {
  const editor = view.value
  if (!editor) {
    return
  }
  editor.dispatch({
    effects: setErrorRangesEffect.of(clampRanges(props.errorRanges, editor.state.doc.length)),
  })
}

function clampRanges(ranges: readonly SourceRange[], max: number): readonly SourceRange[] {
  return ranges
    .map((range) => ({
      from: Math.max(0, Math.min(range.from, max)),
      to: Math.max(0, Math.min(range.to, max)),
      messageKey: range.messageKey,
    }))
    .filter((range) => range.to > range.from)
}
</script>

<template>
  <div class="min-w-0">
    <label class="sr-only">{{ label }}</label>
    <div ref="editorHost" class="kotlin-editor-shell" />
  </div>
</template>
