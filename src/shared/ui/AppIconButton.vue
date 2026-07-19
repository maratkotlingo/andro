<script setup lang="ts">
import { computed } from 'vue'
import { cx } from '../lib/cx'
import {
  buttonBase,
  buttonVariants,
  focusRing,
  iconButtonSizes,
  type ButtonSize,
  type ButtonVariant,
} from './styles'

const props = withDefaults(
  defineProps<{
    label: string
    variant?: ButtonVariant
    size?: ButtonSize
    disabled?: boolean
  }>(),
  {
    variant: 'ghost',
    size: 'md',
    disabled: false,
  },
)

const buttonClass = computed(() =>
  cx(buttonBase, buttonVariants[props.variant], iconButtonSizes[props.size], focusRing),
)
</script>

<template>
  <button type="button" :aria-label="label" :disabled="disabled" :class="buttonClass">
    <slot />
  </button>
</template>
