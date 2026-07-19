<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'
import AppAlert from '../shared/ui/AppAlert.vue'
import AppButton from '../shared/ui/AppButton.vue'
import { useUiStore } from '../stores/ui'

const errorMessage = ref('')
const router = useRouter()
const ui = useUiStore()

onErrorCaptured((error) => {
  errorMessage.value = error instanceof Error ? error.message : 'Неизвестная ошибка интерфейса'
  ui.notify({
    tone: 'error',
    title: 'Ошибка интерфейса',
    description: 'Показана страница восстановления.',
  })
  return false
})

function reset(): void {
  errorMessage.value = ''
  void router.push('/error')
}
</script>

<template>
  <slot v-if="!errorMessage" />
  <main v-else class="min-h-dvh bg-[var(--color-bg)] p-4 text-[var(--color-text)]">
    <div class="mx-auto flex min-h-[calc(100dvh-2rem)] max-w-2xl items-center">
      <AppAlert title="Интерфейс остановлен" tone="error">
        {{ errorMessage }}
      </AppAlert>
      <div class="mt-4">
        <AppButton variant="secondary" @click="reset">Открыть страницу восстановления</AppButton>
      </div>
    </div>
  </main>
</template>
