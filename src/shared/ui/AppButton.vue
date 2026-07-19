<script setup lang="ts">
import { computed } from 'vue'
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
    variant?: ButtonVariant
    size?: ButtonSize
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
  },
)

const buttonClass = computed(() =>
  cx(buttonBase, buttonVariants[props.variant], buttonSizes[props.size], focusRing),
)
</script>

<template>
  <button :type="type" :disabled="disabled" :class="buttonClass">
    <slot />
  </button>
</template>
