<script setup lang="ts">
import { computed } from 'vue'
import { ProgressIndicator, ProgressRoot } from 'reka-ui'

const props = withDefaults(
  defineProps<{
    value: number
    max?: number
    label?: string
  }>(),
  {
    max: 100,
    label: 'Прогресс',
  },
)

const boundedValue = computed(() => Math.min(Math.max(props.value, 0), props.max))
const width = computed(() => `${(boundedValue.value / props.max) * 100}%`)
</script>

<template>
  <ProgressRoot
    class="h-2 overflow-hidden rounded-full bg-[var(--color-progress-track)]"
    :model-value="boundedValue"
    :max="max"
    :get-value-label="() => label"
  >
    <ProgressIndicator
      class="block h-full rounded-full bg-[var(--color-progress-fill)] transition-[width] duration-300 motion-reduce:transition-none"
      :style="{ width }"
    />
  </ProgressRoot>
</template>
