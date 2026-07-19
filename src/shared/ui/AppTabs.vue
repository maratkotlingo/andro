<script setup lang="ts">
import { computed } from 'vue'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { cx } from '../lib/cx'
import { focusRing } from './styles'
import type { AppTab } from './types'

const props = defineProps<{
  tabs: readonly AppTab[]
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const model = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
})

const triggerClass = cx(
  'h-9 rounded-md px-3 text-sm font-medium text-[var(--color-text-muted)] data-[state=active]:bg-[var(--color-panel)] data-[state=active]:text-[var(--color-text)] data-[state=active]:shadow-sm',
  focusRing,
)
</script>

<template>
  <TabsRoot v-model="model">
    <TabsList
      class="inline-flex rounded-lg bg-[var(--color-panel-raised)] p-1"
      aria-label="Разделы"
    >
      <TabsTrigger v-for="tab in tabs" :key="tab.value" :value="tab.value" :class="triggerClass">
        {{ tab.label }}
      </TabsTrigger>
    </TabsList>
    <TabsContent
      v-for="tab in tabs"
      :key="tab.value"
      :value="tab.value"
      class="mt-4 focus:outline-none"
    >
      <slot :name="tab.value" />
    </TabsContent>
  </TabsRoot>
</template>
