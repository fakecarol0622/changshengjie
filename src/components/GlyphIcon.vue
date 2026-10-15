<template>
  <svg
    :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    :stroke-width="stroke" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
  >
    <path v-for="(p, i) in paths" :key="i" :d="p" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { GLYPHS } from '../core/icons'

const props = withDefaults(defineProps<{ id: string; size?: number; stroke?: number }>(), { size: 20, stroke: 1.7 })
const paths = computed(() => GLYPHS[props.id] || [])
</script>
