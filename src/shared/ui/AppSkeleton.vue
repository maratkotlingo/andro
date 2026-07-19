<script setup lang="ts">
withDefaults(
  defineProps<{
    lines?: number
  }>(),
  {
    lines: 3,
  },
)
</script>

<template>
  <div class="space-y-3" aria-hidden="true">
    <div
      v-for="line in lines"
      :key="line"
      class="h-3 rounded-full bg-[var(--color-skeleton)]"
      :class="line === lines ? 'w-2/3' : 'w-full'"
    />
  </div>
</template>
