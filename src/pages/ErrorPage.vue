<script setup lang="ts">
import AppAlert from '../shared/ui/AppAlert.vue'
import AppLinkButton from '../shared/ui/AppLinkButton.vue'
import AppPageHeader from '../shared/ui/AppPageHeader.vue'
</script>

<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Страница восстановления"
      description="Если интерфейс поймал ошибку, сюда можно вернуться и продолжить локальную работу."
      badge="UI error"
      badge-tone="error"
    />
    <AppAlert title="Данные остаются локальными" tone="neutral">
      Перезагрузка страницы не отправляет прогресс на сервер. Persisted stores читаются из
      `localStorage`.
    </AppAlert>
    <AppLinkButton to="/">Вернуться к обзору</AppLinkButton>
  </div>
</template>
