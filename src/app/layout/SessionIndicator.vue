<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { BookOpen, Repeat2 } from '@lucide/vue'
import { useSessionStore } from '../../stores/session'
import AppBadge from '../../shared/ui/AppBadge.vue'
import AppProgress from '../../shared/ui/AppProgress.vue'

withDefaults(
  defineProps<{
    compact?: boolean
  }>(),
  {
    compact: false,
  },
)

const session = useSessionStore()
</script>

<template>
  <section
    v-if="compact"
    aria-label="Текущая учебная сессия"
    class="hidden min-w-0 items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm md:flex"
  >
    <BookOpen class="size-4 shrink-0 text-[var(--color-text-muted)]" aria-hidden="true" />
    <RouterLink
      :to="session.activeLesson.route"
      class="min-w-0 truncate font-medium text-[var(--color-text)] hover:underline"
    >
      {{ session.activeLesson.title }}
    </RouterLink>
    <span class="h-4 w-px bg-[var(--color-border)]" aria-hidden="true" />
    <span class="inline-flex shrink-0 items-center gap-1 text-[var(--color-text-muted)]">
      <Repeat2 class="size-3.5" aria-hidden="true" />
      {{ session.reviewLessons.length }}
    </span>
  </section>

  <section
    v-else
    aria-label="Текущая учебная сессия"
    class="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-3"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-xs font-medium uppercase tracking-normal text-[var(--color-text-subtle)]">
          Сессия
        </p>
        <RouterLink
          :to="session.activeLesson.route"
          class="mt-1 block truncate text-sm font-semibold text-[var(--color-text)] hover:underline"
        >
          {{ session.activeLesson.title }}
        </RouterLink>
      </div>
      <AppBadge tone="review">{{ session.reviewLessons.length }}</AppBadge>
    </div>
    <div class="mt-3">
      <AppProgress
        :value="session.activeLesson.progress"
        :label="`Прогресс урока ${session.activeLesson.progress}%`"
      />
    </div>
    <div class="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--color-text-muted)]">
      <span class="inline-flex items-center gap-1">
        <BookOpen class="size-3.5" aria-hidden="true" />
        {{ session.completedToday }} задания
      </span>
      <span class="inline-flex items-center gap-1">
        <Repeat2 class="size-3.5" aria-hidden="true" />
        {{ session.sessionMinutes }} мин
      </span>
    </div>
  </section>
</template>
