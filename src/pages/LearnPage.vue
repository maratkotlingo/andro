<script setup lang="ts">
import { demoLessons, stateLabels, stateTones, checkKindLabels } from '../content/demoLearning'
import AppBadge from '../shared/ui/AppBadge.vue'
import AppCard from '../shared/ui/AppCard.vue'
import AppLinkButton from '../shared/ui/AppLinkButton.vue'
import AppPageHeader from '../shared/ui/AppPageHeader.vue'
import AppProgress from '../shared/ui/AppProgress.vue'
</script>

<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Карта курса"
      description="На этом этапе показан маленький локальный срез будущего полного графа: база, null safety, data classes и закрытый раздел Flow."
      badge="route-level lazy"
      badge-tone="success"
    />

    <section class="grid gap-4 md:grid-cols-2">
      <AppCard
        v-for="lesson in demoLessons"
        :key="lesson.id"
        :tone="lesson.state === 'review' ? 'review' : lesson.state === 'new' ? 'new' : 'default'"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <AppBadge :tone="stateTones[lesson.state]">{{ stateLabels[lesson.state] }}</AppBadge>
            <h2 class="mt-3 text-lg font-semibold text-[var(--color-text)]">{{ lesson.title }}</h2>
            <p class="mt-1 text-sm text-[var(--color-text-muted)]">{{ lesson.topic }}</p>
          </div>
          <span class="shrink-0 text-sm text-[var(--color-text-muted)]"
            >{{ lesson.minutes }} мин</span
          >
        </div>
        <p class="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">{{ lesson.summary }}</p>
        <div class="mt-4">
          <AppProgress :value="lesson.progress" :label="`Прогресс ${lesson.title}`" />
        </div>
        <div class="mt-4 flex flex-wrap items-center gap-2">
          <AppBadge tone="neutral">{{ checkKindLabels[lesson.checkKind] }}</AppBadge>
          <AppLinkButton
            :to="lesson.route"
            :variant="lesson.state === 'locked' ? 'secondary' : 'primary'"
          >
            {{ lesson.state === 'locked' ? 'Посмотреть условия' : 'Открыть' }}
          </AppLinkButton>
        </div>
      </AppCard>
    </section>
  </div>
</template>
