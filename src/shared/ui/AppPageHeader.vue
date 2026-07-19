<script setup lang="ts">
import AppBadge from './AppBadge.vue'
import type { BadgeTone } from './styles'

withDefaults(
  defineProps<{
    eyebrow?: string
    title: string
    description?: string
    badge?: string
    badgeTone?: BadgeTone
  }>(),
  {
    eyebrow: '',
    description: '',
    badge: '',
    badgeTone: 'neutral',
  },
)
</script>

<template>
  <header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div class="min-w-0">
      <p v-if="eyebrow" class="text-sm font-medium text-[var(--color-text-muted)]">{{ eyebrow }}</p>
      <h1 class="mt-1 text-2xl font-semibold tracking-normal text-[var(--color-text)] sm:text-3xl">
        {{ title }}
      </h1>
      <p v-if="description" class="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
        {{ description }}
      </p>
    </div>
    <AppBadge v-if="badge" :tone="badgeTone">{{ badge }}</AppBadge>
  </header>
</template>
