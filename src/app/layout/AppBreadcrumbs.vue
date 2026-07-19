<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ChevronRight } from '@lucide/vue'
import type { BreadcrumbItem } from '../../shared/ui/types'

defineProps<{
  items: readonly BreadcrumbItem[]
}>()
</script>

<template>
  <nav
    v-if="items.length > 0"
    aria-label="Хлебные крошки"
    class="hidden text-sm text-[var(--color-text-muted)] sm:block"
  >
    <ol class="flex min-w-0 items-center gap-1">
      <li
        v-for="(item, index) in items"
        :key="`${item.label}-${index}`"
        class="flex min-w-0 items-center gap-1"
      >
        <RouterLink
          v-if="item.to"
          :to="item.to"
          class="truncate rounded-sm hover:text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
        >
          {{ item.label }}
        </RouterLink>
        <span v-else class="truncate text-[var(--color-text)]">{{ item.label }}</span>
        <ChevronRight v-if="index < items.length - 1" class="size-4 shrink-0" aria-hidden="true" />
      </li>
    </ol>
  </nav>
</template>
