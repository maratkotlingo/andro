<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import { Inbox } from '@lucide/vue'

const props = defineProps<{
  title: string
  description: string
  icon?: Component
}>()

const displayIcon = computed(() => props.icon ?? Inbox)
</script>

<template>
  <div class="rounded-lg border border-dashed border-[var(--color-border-strong)] p-6 text-center">
    <component
      :is="displayIcon"
      class="mx-auto size-8 text-[var(--color-text-subtle)]"
      aria-hidden="true"
    />
    <h2 class="mt-3 text-base font-semibold text-[var(--color-text)]">{{ title }}</h2>
    <p class="mx-auto mt-2 max-w-md text-sm text-[var(--color-text-muted)]">{{ description }}</p>
    <div v-if="$slots.default" class="mt-4">
      <slot />
    </div>
  </div>
</template>
