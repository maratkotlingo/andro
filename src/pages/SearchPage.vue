<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search } from '@lucide/vue'
import { searchItems } from '../content/demoLearning'
import AppCard from '../shared/ui/AppCard.vue'
import AppEmptyState from '../shared/ui/AppEmptyState.vue'
import AppLinkButton from '../shared/ui/AppLinkButton.vue'
import AppPageHeader from '../shared/ui/AppPageHeader.vue'

const query = ref('')

const results = computed(() => {
  const normalized = query.value.trim().toLowerCase()
  if (!normalized) {
    return searchItems
  }

  return searchItems.filter((item) =>
    `${item.title} ${item.area} ${item.excerpt}`.toLowerCase().includes(normalized),
  )
})
</script>

<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Поиск по материалам"
      description="Сейчас это быстрый локальный фильтр по демо-материалам. Полный индекс можно заменить MiniSearch на этапе content infrastructure."
    />

    <label class="relative block">
      <span class="sr-only">Поиск</span>
      <Search
        class="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[var(--color-text-muted)]"
      />
      <input
        v-model="query"
        class="h-11 w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-input)] pl-10 pr-3 text-sm text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
        placeholder="Например: Elvis, val, Flow"
      />
    </label>

    <section v-if="results.length > 0" class="grid gap-4">
      <AppCard v-for="item in results" :key="item.id">
        <p class="text-sm text-[var(--color-text-muted)]">{{ item.area }}</p>
        <h2 class="mt-1 text-lg font-semibold text-[var(--color-text)]">{{ item.title }}</h2>
        <p class="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{{ item.excerpt }}</p>
        <AppLinkButton :to="item.route" variant="secondary" class="mt-4"
          >Открыть материал</AppLinkButton
        >
      </AppCard>
    </section>

    <AppEmptyState
      v-else
      title="Ничего не найдено"
      description="Попробуйте другой термин из демо-набора: val, Elvis, Flow."
    />
  </div>
</template>
