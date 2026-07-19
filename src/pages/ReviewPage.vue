<script setup lang="ts">
import { getDueReviewLessons, checkKindLabels } from '../content/demoLearning'
import { useSessionStore } from '../stores/session'
import AppBadge from '../shared/ui/AppBadge.vue'
import AppButton from '../shared/ui/AppButton.vue'
import AppCard from '../shared/ui/AppCard.vue'
import AppEmptyState from '../shared/ui/AppEmptyState.vue'
import AppLinkButton from '../shared/ui/AppLinkButton.vue'
import AppPageHeader from '../shared/ui/AppPageHeader.vue'

const session = useSessionStore()
const reviewLessons = getDueReviewLessons()
</script>

<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Интервальное повторение"
      description="Повторение появляется отдельно от нового материала, чтобы навык считался освоенным только после отложенной проверки."
      badge="spaced repetition"
      badge-tone="review"
    />

    <section v-if="reviewLessons.length > 0" class="grid gap-4 md:grid-cols-2">
      <AppCard v-for="lesson in reviewLessons" :key="lesson.id" tone="review">
        <AppBadge tone="review">{{ checkKindLabels[lesson.checkKind] }}</AppBadge>
        <h2 class="mt-3 text-lg font-semibold text-[var(--color-text)]">{{ lesson.title }}</h2>
        <p class="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{{ lesson.exercise }}</p>
        <div class="mt-4 flex flex-wrap gap-2">
          <AppLinkButton :to="lesson.route">Открыть карточку</AppLinkButton>
          <AppButton variant="secondary" @click="session.recordDemoCompletion"
            >Отметить демо-повтор</AppButton
          >
        </div>
      </AppCard>
    </section>

    <AppEmptyState
      v-else
      title="Повторений нет"
      description="Когда появятся просроченные карточки, они будут показаны здесь отдельно от нового материала."
    />
  </div>
</template>
