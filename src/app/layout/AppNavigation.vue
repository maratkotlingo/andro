<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { navigationItems, type NavigationItem } from '../navigation'
import { cx } from '../../shared/lib/cx'
import { focusRing } from '../../shared/ui/styles'

withDefaults(
  defineProps<{
    compact?: boolean
  }>(),
  {
    compact: false,
  },
)

defineEmits<{
  navigate: []
}>()

const route = useRoute()

function isActive(item: NavigationItem): boolean {
  if (item.path === '/') {
    return route.path === '/'
  }

  return item.match.some((match) => route.path === match || route.path.startsWith(`${match}/`))
}

const linkBase = computed(() =>
  cx(
    'group flex min-w-0 items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-150 motion-reduce:transition-none',
    focusRing,
  ),
)
</script>

<template>
  <nav aria-label="Основная навигация">
    <ul class="grid gap-1">
      <li v-for="item in navigationItems" :key="item.path">
        <RouterLink
          :to="item.path"
          :aria-current="isActive(item) ? 'page' : undefined"
          :class="
            cx(
              linkBase,
              isActive(item)
                ? 'bg-[var(--color-nav-active)] text-[var(--color-text)]'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-panel-raised)] hover:text-[var(--color-text)]',
            )
          "
          @click="$emit('navigate')"
        >
          <component :is="item.icon" class="size-4 shrink-0" aria-hidden="true" />
          <span class="min-w-0">
            <span class="block truncate font-medium">{{ item.label }}</span>
            <span v-if="!compact" class="block truncate text-xs text-[var(--color-text-subtle)]">
              {{ item.description }}
            </span>
          </span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
