<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import { cx } from '../lib/cx'
import {
  buttonBase,
  buttonSizes,
  buttonVariants,
  focusRing,
  type ButtonSize,
  type ButtonVariant,
} from './styles'

const props = withDefaults(
  defineProps<{
    to: RouteLocationRaw
    variant?: ButtonVariant
    size?: ButtonSize
  }>(),
  {
    variant: 'primary',
    size: 'md',
  },
)

const linkClass = computed(() =>
  cx(buttonBase, buttonVariants[props.variant], buttonSizes[props.size], focusRing),
)
</script>

<template>
  <RouterLink :to="to" :class="linkClass">
    <slot />
  </RouterLink>
</template>
