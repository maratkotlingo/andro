<script setup lang="ts">
import { computed } from 'vue'
import { cx } from '../lib/cx'
import { cardBase, cardTones, type CardTone } from './styles'

const props = withDefaults(
  defineProps<{
    tone?: CardTone
    padded?: boolean
  }>(),
  {
    tone: 'default',
    padded: true,
  },
)

const cardClass = computed(() => cx(cardBase, cardTones[props.tone], props.padded && 'p-4 sm:p-5'))
</script>

<template>
  <section :class="cardClass">
    <slot />
  </section>
</template>
