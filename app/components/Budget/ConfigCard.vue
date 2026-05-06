<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
    <div class="flex justify-between items-start mb-4">
      <h2 class="text-lg font-semibold text-gray-700 dark:text-gray-200">
        Budget Config — {{ selectedYear }}
      </h2>
      <Button
        icon="pi pi-pencil"
        label="Edit"
        size="small"
        text
        @click="$emit('edit')"
      />
    </div>
    <div class="grid grid-cols-3 gap-4 text-sm mb-4">
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
          Monthly Total
        </p>
        <p class="font-bold text-gray-800 dark:text-gray-100">
          {{ formatCurrency(budgetYear.totalMonthly) }}
        </p>
      </div>
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
          MF Equity Default
        </p>
        <p class="font-bold text-gray-800 dark:text-gray-100">
          {{ formatCurrency(budgetYear.mfEquity ?? 0) }}
        </p>
      </div>
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
          PPF Default
        </p>
        <p class="font-bold text-gray-800 dark:text-gray-100">
          {{ formatCurrency(budgetYear.ppf ?? 0) }}
        </p>
      </div>
    </div>
    <div class="grid grid-cols-3 sm:grid-cols-6 gap-4 text-sm">
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
          Equity
        </p>
        <p class="font-semibold">
          {{ formatPercentage(budgetYear.equityPercentage * 100) }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ formatCurrency(budgetYear.totalMonthly * budgetYear.equityPercentage) }}
        </p>
      </div>
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
          Debt
        </p>
        <p class="font-semibold">
          {{ formatPercentage(budgetYear.debtPercentage * 100) }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ formatCurrency(budgetYear.totalMonthly * budgetYear.debtPercentage) }}
        </p>
      </div>
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
          Commodity
        </p>
        <p class="font-semibold">
          {{ formatPercentage(budgetYear.commodityPercentage * 100) }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ formatCurrency(budgetYear.totalMonthly * budgetYear.commodityPercentage) }}
        </p>
      </div>
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
          Gold
        </p>
        <p class="font-semibold">
          {{ formatPercentage(budgetYear.goldPercentage * 100) }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ formatCurrency(budgetYear.totalMonthly * budgetYear.commodityPercentage * budgetYear.goldPercentage) }}
        </p>
      </div>
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
          Silver
        </p>
        <p class="font-semibold">
          {{ formatPercentage(budgetYear.silverPercentage * 100) }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ formatCurrency(budgetYear.totalMonthly * budgetYear.commodityPercentage * budgetYear.silverPercentage) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency, formatPercentage } from '~/composables/useCalculations'

defineProps({
  budgetYear: { type: Object, required: true },
  selectedYear: { type: Number, required: true },
})

defineEmits(['edit'])
</script>
