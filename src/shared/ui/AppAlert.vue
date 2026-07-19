<script setup lang="ts">
import { computed } from 'vue'
import { CircleAlert, CircleCheck, Info, TriangleAlert } from '@lucide/vue'
import { cx } from '../lib/cx'
import type { BadgeTone } from './styles'

const props = withDefaults(
  defineProps<{
    tone?: BadgeTone
    title: string
  }>(),
  {
    tone: 'neutral',
  },
)

const toneClass = computed(() => {
  const classes: Record<BadgeTone, string> = {
    neutral: 'border-[var(--color-border)] bg-[var(--color-panel-raised)]',
    new: 'border-[var(--color-new-border)] bg-[var(--color-new-surface)]',
    review: 'border-[var(--color-review-border)] bg-[var(--color-review-surface)]',
    error: 'border-[var(--color-error-border)] bg-[var(--color-error-surface)]',
    success: 'border-[var(--color-success-border)] bg-[var(--color-success-surface)]',
    warning: 'border-[var(--color-warning-border)] bg-[var(--color-warning-surface)]',
  }
  return classes[props.tone]
})

const icon = computed(() => {
  if (props.tone === 'error') return CircleAlert
  if (props.tone === 'success') return CircleCheck
  if (props.tone === 'warning' || props.tone === 'review') return TriangleAlert
  return Info
})
</script>

<template>
  <div :class="cx('flex gap-3 rounded-lg border p-4 text-sm', toneClass)" role="status">
    <component
      :is="icon"
      class="mt-0.5 size-5 shrink-0 text-[var(--color-text-muted)]"
      aria-hidden="true"
    />
    <div class="min-w-0">
      <p class="font-semibold text-[var(--color-text)]">{{ title }}</p>
      <div class="mt-1 text-[var(--color-text-muted)]">
        <slot />
      </div>
    </div>
  </div>
</template>
