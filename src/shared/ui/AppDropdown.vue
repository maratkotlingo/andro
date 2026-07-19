<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'reka-ui'
import { floatingPanel, focusRing } from './styles'
import type { DropdownItem } from './types'

withDefaults(
  defineProps<{
    label?: string
    items: readonly DropdownItem[]
  }>(),
  {
    label: '',
  },
)

defineEmits<{
  select: [id: string]
}>()
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <slot name="trigger" />
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent :class="floatingPanel" :side-offset="8" align="end">
        <DropdownMenuLabel
          v-if="label"
          class="px-2 py-1.5 text-xs font-semibold text-[var(--color-text-muted)]"
        >
          {{ label }}
        </DropdownMenuLabel>
        <template v-for="item in items" :key="item.id">
          <DropdownMenuSeparator
            v-if="item.separatorBefore"
            class="my-1 h-px bg-[var(--color-border)]"
          />
          <DropdownMenuItem
            :class="[
              'min-w-48 cursor-default rounded-md px-2 py-2 text-sm text-[var(--color-text)] outline-none data-[highlighted]:bg-[var(--color-panel-raised)]',
              focusRing,
            ]"
            @select="$emit('select', item.id)"
          >
            <span class="flex flex-col">
              <span>{{ item.label }}</span>
              <span v-if="item.description" class="text-xs text-[var(--color-text-muted)]">
                {{ item.description }}
              </span>
            </span>
          </DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
