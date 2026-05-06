<template>
  <Dialog
    :visible="visible"
    modal
    :header="`Extra Debt — ${monthLabel}`"
    :style="{ width: '26rem' }"
    @update:visible="(v) => { if (!v) $emit('close') }"
  >
    <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
      Positive = over-invested vs target. Negative = under-invested.
    </p>
    <div class="space-y-0 text-sm">
      <div class="flex justify-between py-2 border-b dark:border-gray-700">
        <span class="text-gray-500">Budget Debt (target)</span>
        <span class="font-medium">{{ formatCurrency(gapRow?.budgetDebt ?? 0) }}</span>
      </div>
      <div class="flex justify-between py-2 border-b dark:border-gray-700">
        <span class="text-gray-500">Actual Debt (invested)</span>
        <span class="text-red-600 dark:text-red-400 font-medium">{{ formatCurrency(-(gapRow?.actualDebt ?? 0)) }}</span>
      </div>
      <div class="flex justify-between font-bold text-base pt-2">
        <span>Gap</span>
        <span
          :class="
            (gapRow?.extraDebt ?? 0) >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-500 dark:text-red-400'
          "
        >
          {{ formatCurrency(gapRow?.extraDebt ?? 0) }}
        </span>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { formatCurrency } from '~/composables/useCalculations'

defineProps({
  visible: { type: Boolean, required: true },
  monthLabel: { type: String, default: '' },
  gapRow: { type: Object, default: null },
})

defineEmits(['close'])
</script>
