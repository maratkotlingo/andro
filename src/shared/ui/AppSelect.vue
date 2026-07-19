<script setup lang="ts">
import { computed } from 'vue'
import { Check, ChevronDown } from '@lucide/vue'
import {
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'
import { cx } from '../lib/cx'
import { fieldBase, floatingPanel, focusRing } from './styles'
import type { SelectOption } from './types'

const props = defineProps<{
  modelValue: string
  options: readonly SelectOption[]
  label: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const model = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
})
</script>

<template>
  <label class="grid gap-1.5 text-sm font-medium text-[var(--color-text)]">
    <span>{{ label }}</span>
    <SelectRoot v-model="model">
      <SelectTrigger
        :class="cx(fieldBase, focusRing, 'inline-flex items-center justify-between gap-2')"
      >
        <SelectValue />
        <SelectIcon>
          <ChevronDown class="size-4 text-[var(--color-text-muted)]" aria-hidden="true" />
        </SelectIcon>
      </SelectTrigger>
      <SelectPortal>
        <SelectContent :class="floatingPanel" :side-offset="6">
          <SelectViewport>
            <SelectItem
              v-for="option in options"
              :key="option.value"
              :value="option.value"
              :class="[
                'relative flex cursor-default select-none items-center rounded-md py-2 pl-8 pr-3 text-sm text-[var(--color-text)] outline-none data-[highlighted]:bg-[var(--color-panel-raised)]',
                focusRing,
              ]"
            >
              <SelectItemIndicator class="absolute left-2 inline-flex items-center">
                <Check class="size-4" aria-hidden="true" />
              </SelectItemIndicator>
              <SelectItemText>{{ option.label }}</SelectItemText>
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
  </label>
</template>
