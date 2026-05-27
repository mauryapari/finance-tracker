<template>
  <div>
    <p class="text-xs font-semibold mb-1" :class="titleClass">{{ title }}</p>
    <ul class="space-y-1 list-none m-0 p-0">
      <li
        v-for="(item, i) in items"
        :key="i"
        class="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400"
      >
        <span :class="dotClass" class="mt-1 w-1.5 h-1.5 rounded-full shrink-0" aria-hidden="true" />
        {{ item }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const { color = 'gray' } = defineProps<{
  title: string
  items: string[]
  color?: 'green' | 'red' | 'yellow' | 'gray'
}>()

const COLOR_TITLE: Record<string, string> = {
  green:  'text-green-700 dark:text-green-400',
  red:    'text-red-700 dark:text-red-400',
  yellow: 'text-yellow-700 dark:text-yellow-400',
  gray:   'text-gray-600 dark:text-gray-400',
}

const COLOR_DOT: Record<string, string> = {
  green:  'bg-green-500',
  red:    'bg-red-500',
  yellow: 'bg-yellow-500',
  gray:   'bg-gray-400',
}

const titleClass = computed(() => COLOR_TITLE[color] ?? COLOR_TITLE.gray)
const dotClass   = computed(() => COLOR_DOT[color] ?? COLOR_DOT.gray)
</script>
