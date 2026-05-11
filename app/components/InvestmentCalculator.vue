<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-5 space-y-4">
    <h2 class="text-lg font-semibold text-gray-700 dark:text-gray-200">Investment Calculator</h2>

    <div class="flex gap-3 flex-wrap">
      <div class="flex flex-col gap-1 flex-1 min-w-44">
        <label
          for="calc-amount"
          class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide"
        >Amount (₹)</label>
        <InputNumber
          v-model="amount"
          input-id="calc-amount"
          :min="0"
          :max-fraction-digits="2"
          placeholder="Enter amount"
          class="w-full"
          data-testid="calc-amount"
        />
      </div>
      <div class="flex flex-col gap-1 flex-1 min-w-44">
        <label
          for="calc-portfolio"
          class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide"
        >Portfolio</label>
        <Select
          v-model="selectedPortfolio"
          input-id="calc-portfolio"
          :options="portfolioOptions"
          option-label="label"
          option-value="value"
          class="w-full"
          data-testid="calc-portfolio"
        />
      </div>
    </div>

    <div
      v-if="amount && amount > 0 && portfolioValue > 0"
      class="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 p-4 space-y-2"
      data-testid="calc-result"
    >
      <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {{ selectedLabel }} · ₹{{ formatNumber(portfolioValue) }}
      </p>
      <div class="flex gap-8 flex-wrap mt-1">
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-0.5">% of current portfolio</p>
          <p
            class="text-2xl font-bold text-indigo-600 dark:text-indigo-400"
            data-testid="current-pct"
          >{{ currentPct.toFixed(2) }}%</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-0.5">% after investing</p>
          <p
            class="text-2xl font-bold text-gray-700 dark:text-gray-200"
            data-testid="after-pct"
          >{{ afterPct.toFixed(2) }}%</p>
        </div>
      </div>
    </div>

    <p
      v-else-if="portfolioValue === 0"
      class="text-xs text-gray-400 dark:text-gray-500 italic"
      data-testid="no-prices"
    >No positions with live prices loaded yet.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDataStore } from '~/stores/data'

const store = useDataStore()

const amount = ref<number | null>(null)

const portfolioOptions = [
  { label: 'Stock Portfolio', value: 'stock' },
  { label: 'Commodity Portfolio', value: 'commodity' },
  { label: 'Total (Both)', value: 'total' },
]
const selectedPortfolio = ref<'stock' | 'commodity' | 'total'>('stock')

const selectedLabel = computed(
  () => portfolioOptions.find(o => o.value === selectedPortfolio.value)?.label ?? ''
)

const stockNetValue = computed(() =>
  [...store.tables.openPositions, ...store.tables.etfs]
    .reduce((s, p) => s + (p.cmp || 0) * (p.qty || 0), 0)
)

const commodityNetValue = computed(() =>
  store.tables.commodityEtfs
    .reduce((s, p) => s + (p.cmp || 0) * (p.qty || 0), 0)
)

const portfolioValue = computed(() => {
  if (selectedPortfolio.value === 'stock') return stockNetValue.value
  if (selectedPortfolio.value === 'commodity') return commodityNetValue.value
  return stockNetValue.value + commodityNetValue.value
})

const currentPct = computed(() =>
  portfolioValue.value > 0 ? ((amount.value ?? 0) / portfolioValue.value) * 100 : 0
)

const afterPct = computed(() => {
  const a = amount.value ?? 0
  const total = portfolioValue.value + a
  return total > 0 ? (a / total) * 100 : 0
})

function formatNumber(n: number): string {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}
</script>
