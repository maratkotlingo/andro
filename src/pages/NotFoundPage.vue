<script setup lang="ts">
import { useRoute } from 'vue-router'
import AppEmptyState from '../shared/ui/AppEmptyState.vue'
import AppLinkButton from '../shared/ui/AppLinkButton.vue'
import AppPageHeader from '../shared/ui/AppPageHeader.vue'

const route = useRoute()
</script>

<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Страница не найдена"
      description="Fallback-маршрут работает и возвращает пользователя к известным разделам приложения."
    />
    <AppEmptyState
      title="Неизвестный маршрут"
      :description="`Путь ${route.fullPath} не найден в локальном тренажере.`"
    >
      <AppLinkButton to="/">Вернуться к обзору</AppLinkButton>
    </AppEmptyState>
  </div>
</template>
