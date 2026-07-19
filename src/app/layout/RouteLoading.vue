<script setup lang="ts">
import AppSkeleton from '../../shared/ui/AppSkeleton.vue'
</script>

<template>
  <div class="space-y-6" aria-live="polite" aria-busy="true">
    <div>
      <div class="h-8 w-56 rounded-md bg-[var(--color-skeleton)]" />
      <div class="mt-3 h-4 w-full max-w-xl rounded-md bg-[var(--color-skeleton)]" />
    </div>
    <div class="grid gap-4 md:grid-cols-2">
      <div class="rounded-lg border border-[var(--color-border)] p-5">
        <AppSkeleton :lines="4" />
      </div>
      <div class="rounded-lg border border-[var(--color-border)] p-5">
        <AppSkeleton :lines="4" />
      </div>
    </div>
  </div>
</template>
