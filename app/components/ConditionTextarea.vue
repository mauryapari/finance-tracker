<template>
  <div class="flex flex-col gap-1">
    <label :for="`cond-${testid}`" class="text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ label }}
    </label>
    <textarea
      :id="`cond-${testid}`"
      :value="modelValue"
      rows="3"
      :placeholder="placeholder"
      class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
      :data-testid="testid"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <p class="text-xs text-gray-400">One condition per line</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  label: string
  placeholder?: string
  testid?: string
}>()

defineEmits<{ 'update:modelValue': [value: string] }>()
</script>
