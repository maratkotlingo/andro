<script setup lang="ts">
import AppErrorBoundary from './app/AppErrorBoundary.vue'
import AppShell from './app/layout/AppShell.vue'
import AppToast from './shared/ui/AppToast.vue'
</script>

<template>
  <AppErrorBoundary>
    <AppShell />
  </AppErrorBoundary>
  <AppToast />
</template>
