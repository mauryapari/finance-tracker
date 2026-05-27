<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-5 flex flex-col gap-2">

    <!-- Amount input -->
    <div class="flex flex-col gap-1">
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
        @update:model-value="showResult = false"
      />
    </div>

    <!-- Portfolio select -->
    <div class="flex flex-col gap-1">
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
        @update:model-value="showResult = false"
      />
    </div>

    <!-- Calculate button -->
    <Button
      label="Calculate"
      class="w-full"
      data-testid="calc-button"
      :disabled="!amount || amount <= 0"
      @click="calculate"
    />

    <!-- Result -->
    <div
      v-if="showResult && amount && amount > 0 && portfolioValue > 0"
      class="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 p-3 flex flex-col gap-2"
      data-testid="calc-result"
    >
      <p class="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-tight">
        {{ selectedLabel }}<br>₹{{ formatNumber(portfolioValue) }}
      </p>
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400">% of current</p>
        <p
          class="text-xl font-bold text-indigo-600 dark:text-indigo-400"
          data-testid="current-pct"
        >{{ currentPct.toFixed(2) }}%</p>
      </div>
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400">% after investing</p>
        <p
          class="text-xl font-bold text-gray-700 dark:text-gray-200"
          data-testid="after-pct"
        >{{ afterPct.toFixed(2) }}%</p>
      </div>
    </div>

    <p
      v-else-if="showResult && portfolioValue === 0"
      class="text-xs text-gray-400 dark:text-gray-500 italic"
      data-testid="no-prices"
    >No live prices yet.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDataStore } from '~/stores/data'

const store = useDataStore()

const amount = ref<number | null>(null)
const showResult = ref(false)

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

function calculate() {
  showResult.value = true
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}
</script>
