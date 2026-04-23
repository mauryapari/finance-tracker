<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-5 space-y-3">
    <h2 class="text-lg font-semibold text-gray-700 dark:text-gray-200">{{ title }}</h2>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <p class="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Net Value</p>
        <p class="text-xl font-bold text-gray-800 dark:text-gray-100">{{ fmt(summary.netValue) }}</p>
      </div>
      <div>
        <p class="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Invested</p>
        <p class="text-xl font-bold text-gray-800 dark:text-gray-100">{{ fmt(summary.totalInvested) }}</p>
      </div>
      <div>
        <p class="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Profit / Loss</p>
        <p :class="['text-xl font-bold', summary.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400']">
          {{ fmt(summary.profit) }}
          <span class="text-sm">({{ summary.profitPct.toFixed(2) }}%)</span>
        </p>
      </div>
      <div>
        <p class="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">CAGR</p>
        <p :class="['text-xl font-bold', cagr >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400']">
          {{ cagr.toFixed(2) }}%
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  summary: { type: Object, default: () => ({ netValue: 0, totalInvested: 0, profit: 0, profitPct: 0, cagr: 0 }) },
  cagr: { type: Number, default: 0 }
})

function fmt(n) {
  return '₹' + (n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })
}
</script>
