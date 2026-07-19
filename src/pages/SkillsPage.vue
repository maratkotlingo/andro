<script setup lang="ts">
import { demoSkills, stateLabels, stateTones } from '../content/demoLearning'
import AppBadge from '../shared/ui/AppBadge.vue'
import AppCard from '../shared/ui/AppCard.vue'
import AppPageHeader from '../shared/ui/AppPageHeader.vue'
import AppProgress from '../shared/ui/AppProgress.vue'
</script>

<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Граф навыков"
      description="Навыки представлены как зависимости. Поздние темы остаются закрытыми, пока не освоены prerequisites."
    />

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <AppCard
        v-for="skill in demoSkills"
        :key="skill.id"
        :tone="skill.state === 'review' ? 'review' : skill.state === 'new' ? 'new' : 'default'"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm text-[var(--color-text-muted)]">{{ skill.area }}</p>
            <h2 class="text-lg font-semibold text-[var(--color-text)]">{{ skill.label }}</h2>
          </div>
          <AppBadge :tone="stateTones[skill.state]">{{ stateLabels[skill.state] }}</AppBadge>
        </div>
        <div class="mt-4">
          <AppProgress :value="skill.mastery" :label="`Освоение ${skill.label}`" />
        </div>
        <p class="mt-3 text-sm text-[var(--color-text-muted)]">
          Prerequisites:
          <span v-if="skill.dependsOn.length === 0">нет</span>
          <span v-else>{{ skill.dependsOn.join(', ') }}</span>
        </p>
      </AppCard>
    </section>
  </div>
</template>
