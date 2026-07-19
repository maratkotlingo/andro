<script setup lang="ts">
import { demoLessons, getDueReviewLessons, stateLabels, stateTones } from '../content/demoLearning'
import { useSessionStore } from '../stores/session'
import AppBadge from '../shared/ui/AppBadge.vue'
import AppCard from '../shared/ui/AppCard.vue'
import AppCodeBlock from '../shared/ui/AppCodeBlock.vue'
import AppLinkButton from '../shared/ui/AppLinkButton.vue'
import AppPageHeader from '../shared/ui/AppPageHeader.vue'
import AppProgress from '../shared/ui/AppProgress.vue'

const session = useSessionStore()
const reviewLessons = getDueReviewLessons()
</script>

<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Продолжение обучения"
      description="Локальный тренажер показывает ближайший урок, повторения и честный тип проверки без запуска Kotlin-кода."
      badge="offline-first"
      badge-tone="success"
    />

    <section class="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <AppCard tone="new">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div class="min-w-0">
            <AppBadge :tone="stateTones[session.activeLesson.state]">
              {{ stateLabels[session.activeLesson.state] }}
            </AppBadge>
            <h2 class="mt-3 text-xl font-semibold text-[var(--color-text)]">
              {{ session.activeLesson.title }}
            </h2>
            <p class="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
              {{ session.activeLesson.summary }}
            </p>
            <div class="mt-4 max-w-md">
              <AppProgress
                :value="session.activeLesson.progress"
                :label="`Прогресс ${session.activeLesson.progress}%`"
              />
            </div>
            <div class="mt-5 flex flex-wrap gap-2">
              <AppLinkButton :to="session.activeLesson.route">Открыть урок</AppLinkButton>
              <AppLinkButton to="/learn" variant="secondary">Карта курса</AppLinkButton>
            </div>
          </div>
          <div class="min-w-0 lg:w-80">
            <AppCodeBlock :code="session.activeLesson.code" label="Фрагмент урока" />
          </div>
        </div>
      </AppCard>

      <AppCard tone="review">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-medium text-[var(--color-text-muted)]">Повторение</p>
            <h2 class="text-xl font-semibold text-[var(--color-text)]">
              {{ reviewLessons.length }} карточка
            </h2>
          </div>
          <AppBadge tone="review">сегодня</AppBadge>
        </div>
        <ul class="mt-4 space-y-3">
          <li
            v-for="lesson in reviewLessons"
            :key="lesson.id"
            class="rounded-md bg-[var(--color-panel)] p-3"
          >
            <p class="font-medium text-[var(--color-text)]">{{ lesson.title }}</p>
            <p class="mt-1 text-sm text-[var(--color-text-muted)]">{{ lesson.exercise }}</p>
          </li>
        </ul>
        <AppLinkButton to="/review" variant="secondary" class="mt-4"
          >Перейти к повторению</AppLinkButton
        >
      </AppCard>
    </section>

    <section class="grid gap-4 md:grid-cols-3">
      <AppCard v-for="lesson in demoLessons.slice(0, 3)" :key="lesson.id">
        <AppBadge :tone="stateTones[lesson.state]">{{ stateLabels[lesson.state] }}</AppBadge>
        <h2 class="mt-3 text-base font-semibold text-[var(--color-text)]">{{ lesson.title }}</h2>
        <p class="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{{ lesson.summary }}</p>
        <div class="mt-4">
          <AppProgress :value="lesson.progress" :label="`Прогресс ${lesson.title}`" />
        </div>
      </AppCard>
    </section>
  </div>
</template>
