<template>
  <!-- Gap: Extra Commodities Dialog -->
  <Dialog
    :visible="visible"
    modal
    :header="`Extra Commodities — ${monthLabel}`"
    :style="{ width: '30rem' }"
    @update:visible="(v) => { if (!v) { $emit('close'); extraCommSub = null; } }"
  >
    <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
      Breakdown of commodity investment vs budget target.
    </p>
    <div class="space-y-0 text-sm">
      <Button
        variant="text"
        severity="secondary"
        class="w-full !flex !justify-between py-2 border-b dark:border-gray-700 rounded px-1"
        @click="extraCommSub = { type: 'ec-budget' }"
      >
        <span class="text-gray-500">Budget Commodities</span>
        <span class="font-medium text-blue-600 dark:text-blue-400 underline underline-offset-2">
          {{ formatCurrency(gapRow?.budgetCommodities ?? 0) }}
        </span>
      </Button>
      <Button
        variant="text"
        severity="secondary"
        class="w-full !flex !justify-between py-2 border-b dark:border-gray-700 rounded px-1"
        @click="extraCommSub = { type: 'ec-actual' }"
      >
        <span class="text-gray-500">Actual Commodities</span>
        <span class="font-medium text-red-600 dark:text-red-400 underline underline-offset-2">
          {{ formatCurrency(gapRow?.actualCommodities ?? 0) }}
        </span>
      </Button>
      <Button
        variant="text"
        severity="secondary"
        class="w-full !flex !justify-between py-2 border-b dark:border-gray-700 rounded px-1"
        @click="extraCommSub = { type: 'ec-fresh' }"
      >
        <span class="text-gray-500">Fresh Commodities</span>
        <span class="font-medium text-blue-600 dark:text-blue-400 underline underline-offset-2">
          {{ formatCurrency(gapRow?.freshCommodities ?? 0) }}
        </span>
      </Button>
      <div class="flex justify-between font-bold text-base pt-2">
        <span>Gap</span>
        <span
          :class="
            (gapRow?.extraCommodities ?? 0) >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-500 dark:text-red-400'
          "
        >
          {{ formatCurrency(gapRow?.extraCommodities ?? 0) }}
        </span>
      </div>
    </div>
  </Dialog>

  <!-- Extra Commodities: Budget sub-dialog -->
  <Dialog
    :visible="extraCommSub?.type === 'ec-budget'"
    modal
    :header="`Budget Commodities — ${monthLabel}`"
    :style="{ width: '26rem' }"
    @update:visible="(v) => { if (!v) extraCommSub = null; }"
  >
    <div class="space-y-0 text-sm">
      <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Target computed from your annual budget config.
      </p>
      <div class="flex justify-between py-2 border-b dark:border-gray-700">
        <span class="text-gray-500">Monthly Budget</span>
        <span class="font-medium">{{ formatCurrency(budgetYear?.totalMonthly ?? 0) }}</span>
      </div>
      <div class="flex justify-between py-2 border-b dark:border-gray-700">
        <span class="text-gray-500">Commodity %</span>
        <span class="font-medium">{{ formatPercentage((budgetYear?.commodityPercentage ?? 0) * 100) }}</span>
      </div>
      <div class="flex justify-between py-2 font-bold text-base">
        <span>Budget Commodities (target)</span>
        <span>{{ formatCurrency(gapRow?.budgetCommodities ?? 0) }}</span>
      </div>
    </div>
  </Dialog>

  <!-- Extra Commodities: Actual sub-dialog -->
  <Dialog
    :visible="extraCommSub?.type === 'ec-actual'"
    modal
    :header="`Actual Commodities — ${monthLabel}`"
    :style="{ width: '44rem' }"
    :content-style="{ maxHeight: '72vh', overflowY: 'auto' }"
    @update:visible="(v) => { if (!v) extraCommSub = null; }"
  >
    <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
      All commodity ETFs bought this month — includes capital recycled from your broker balance.
    </p>
    <template v-if="prefix">
      <BudgetCommodityPurchasesTable :prefix="prefix" />
      <div class="border-t dark:border-gray-600 pt-2 flex justify-between font-bold text-base">
        <span>Actual Commodities</span>
        <span class="text-red-600 dark:text-red-400">{{ formatCurrency(-(gapRow?.actualCommodities ?? 0)) }}</span>
      </div>
    </template>
  </Dialog>

  <!-- Extra Commodities: Fresh sub-dialog -->
  <Dialog
    :visible="extraCommSub?.type === 'ec-fresh'"
    modal
    :header="`Fresh Commodities — ${monthLabel}`"
    :style="{ width: '32rem' }"
    @update:visible="(v) => { if (!v) extraCommSub = null; }"
  >
    <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
      Fresh commodities is salary-only investment — actual commodity buys minus the portion funded by recycled broker proceeds.
    </p>
    <div class="space-y-0 text-sm">
      <div class="flex justify-between py-2 border-b dark:border-gray-700">
        <span class="text-gray-500">Total commodity buys</span>
        <span class="text-red-600 dark:text-red-400">{{ formatCurrency(-(trackingRow?.commodities ?? 0)) }}</span>
      </div>
      <div class="flex justify-between py-2 border-b dark:border-gray-700">
        <span class="text-gray-500">Recycled from broker balance</span>
        <span class="text-green-600 dark:text-green-400">
          {{ formatCurrency((trackingRow?.commodities ?? 0) - (trackingRow?.freshCommodities ?? 0)) }}
        </span>
      </div>
      <div class="flex justify-between font-bold text-base pt-2">
        <span>Fresh Commodities</span>
        <span class="text-red-600 dark:text-red-400">{{ formatCurrency(-(gapRow?.freshCommodities ?? 0)) }}</span>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatCurrency, formatPercentage } from '~/composables/useCalculations'

const props = defineProps({
  visible: { type: Boolean, required: true },
  year: { type: Number, default: null },
  month: { type: Number, default: null },
  monthLabel: { type: String, default: '' },
  gapRow: { type: Object, default: null },
  trackingRow: { type: Object, default: null },
  budgetYear: { type: Object, default: null },
})

defineEmits(['close'])

const extraCommSub = ref<{ type: string } | null>(null)

const prefix = computed(() => {
  if (!props.year || !props.month) return null
  return `${props.year}-${String(props.month).padStart(2, '0')}`
})
</script>
