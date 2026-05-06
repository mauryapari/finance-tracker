<template>
  <Dialog
    :visible="visible"
    modal
    :header="`Investment Breakdown — ${monthLabel}`"
    :style="{ width: '32rem' }"
    @update:visible="(v) => { if (!v) $emit('close') }"
  >
    <template v-if="trackingRow">
      <div class="space-y-4 text-sm">
        <div>
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Equity
          </p>
          <div class="space-y-1 pl-2">
            <div class="flex justify-between">
              <span class="text-gray-500">Stock + ETFs</span>
              <span class="text-red-600 dark:text-red-400">{{ formatCurrency(-trackingRow.stockEquityEtfs) }}</span>
            </div>
            <div class="flex justify-between pl-4 text-xs text-gray-400">
              <span>Open Positions</span>
              <span>{{ formatCurrency(-trackingRow.stockEquityEtfsBreakdown.openPositions) }}</span>
            </div>
            <div class="flex justify-between pl-4 text-xs text-gray-400">
              <span>Closed (buy leg)</span>
              <span>{{ formatCurrency(-trackingRow.stockEquityEtfsBreakdown.closedPositions) }}</span>
            </div>
            <div class="flex justify-between pl-4 text-xs text-gray-400">
              <span>ETFs</span>
              <span>{{ formatCurrency(-trackingRow.stockEquityEtfsBreakdown.etfs) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">MF Equity</span>
              <span class="text-red-600 dark:text-red-400">{{ formatCurrency(-trackingRow.mfEquity) }}</span>
            </div>
          </div>
          <div class="flex justify-between font-semibold border-t dark:border-gray-600 mt-1 pt-1">
            <span>Total Equity</span>
            <span class="text-red-600 dark:text-red-400">{{ formatCurrency(-trackingRow.totalEquity) }}</span>
          </div>
        </div>

        <div>
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Debt
          </p>
          <div class="flex justify-between pl-2">
            <span class="text-gray-500">PPF</span>
            <span class="text-red-600 dark:text-red-400">{{ formatCurrency(-trackingRow.ppf) }}</span>
          </div>
        </div>

        <div>
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Commodities
          </p>
          <div class="space-y-1 pl-2">
            <div class="flex justify-between">
              <span class="text-gray-500">Gold</span>
              <span class="text-red-600 dark:text-red-400">{{ formatCurrency(-trackingRow.commoditiesGold) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Silver</span>
              <span class="text-red-600 dark:text-red-400">{{ formatCurrency(-trackingRow.commoditiesSilver) }}</span>
            </div>
          </div>
          <div class="flex justify-between font-semibold border-t dark:border-gray-600 mt-1 pt-1">
            <span>Total Commodities</span>
            <span class="text-red-600 dark:text-red-400">{{ formatCurrency(-trackingRow.totalCommodities) }}</span>
          </div>
        </div>

        <div class="flex justify-between font-bold text-base border-t-2 dark:border-gray-500 pt-2">
          <span>Net Invested</span>
          <span class="text-red-600 dark:text-red-400">{{ formatCurrency(-trackingRow.total) }}</span>
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { formatCurrency } from '~/composables/useCalculations'

defineProps({
  visible: { type: Boolean, required: true },
  monthLabel: { type: String, default: '' },
  trackingRow: { type: Object, default: null },
})

defineEmits(['close'])
</script>
