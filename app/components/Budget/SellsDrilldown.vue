<template>
  <Dialog
    :visible="visible"
    modal
    :header="`Sell Proceeds — ${monthLabel}`"
    :style="{ width: '44rem' }"
    :content-style="{ maxHeight: '72vh', overflowY: 'auto' }"
    @update:visible="(v) => { if (!v) $emit('close') }"
  >
    <BudgetSellProceedsTable v-if="prefix" :prefix="prefix" />
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, required: true },
  year: { type: Number, default: null },
  month: { type: Number, default: null },
  monthLabel: { type: String, default: '' },
})

defineEmits(['close'])

const prefix = computed(() => {
  if (!props.year || !props.month) return null
  return `${props.year}-${String(props.month).padStart(2, '0')}`
})
</script>
