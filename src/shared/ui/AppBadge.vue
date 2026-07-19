<script setup lang="ts">
import { computed } from 'vue'
import { cx } from '../lib/cx'
import { badgeTones, type BadgeTone } from './styles'

const props = withDefaults(
  defineProps<{
    tone?: BadgeTone
  }>(),
  {
    tone: 'neutral',
  },
)

const badgeClass = computed(() =>
  cx(
    'inline-flex min-w-0 items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium leading-none',
    badgeTones[props.tone],
  ),
)
</script>

<template>
  <span :class="badgeClass">
    <slot />
  </span>
</template>
