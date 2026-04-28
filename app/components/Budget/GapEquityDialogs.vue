<template>
  <!-- Gap: Extra Equity Dialog -->
  <Dialog
    :visible="visible"
    modal
    :header="`Extra Equity — ${monthLabel}`"
    :style="{ width: '26rem' }"
    @update:visible="(v) => { if (!v) { $emit('close'); extraEquitySub = null; } }"
  >
    <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
      Positive = over-invested vs target. Negative = under-invested.
    </p>
    <div class="space-y-1 text-sm">
      <div class="flex justify-between py-2 border-b dark:border-gray-700">
        <Button
          variant="link"
          label="Budget Equity (target)"
          class="!p-0 underline decoration-dotted decoration-blue-400"
          @click="extraEquitySub = { type: 'ee-budget' }"
        />
        <span class="font-medium ml-4 shrink-0">{{ formatCurrency(gapRow?.budgetEquity ?? 0) }}</span>
      </div>
      <div class="flex justify-between py-2 border-b dark:border-gray-700">
        <Button
          variant="link"
          label="Actual Equity"
          class="!p-0 underline decoration-dotted decoration-blue-400"
          @click="extraEquitySub = { type: 'ee-actual' }"
        />
        <span class="text-red-600 dark:text-red-400 ml-4 shrink-0">{{ formatCurrency(-(gapRow?.actualEquity ?? 0)) }}</span>
      </div>
      <div class="flex justify-between py-2 border-b dark:border-gray-700">
        <Button
          variant="link"
          label="Fresh Equity (salary invested)"
          class="!p-0 underline decoration-dotted decoration-blue-400"
          @click="extraEquitySub = { type: 'ee-fresh' }"
        />
        <span class="text-red-600 dark:text-red-400 ml-4 shrink-0">{{ formatCurrency(-(gapRow?.freshEquity ?? 0)) }}</span>
      </div>
      <div class="flex justify-between font-bold text-base pt-2">
        <span>Gap</span>
        <span
          :class="
            (gapRow?.extraEquity ?? 0) >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-500 dark:text-red-400'
          "
        >{{ formatCurrency(gapRow?.extraEquity ?? 0) }}</span>
      </div>
    </div>
  </Dialog>

  <!-- Extra Equity: Budget sub-dialog -->
  <Dialog
    :visible="extraEquitySub?.type === 'ee-budget'"
    modal
    :header="`Budget Equity — ${monthLabel}`"
    :style="{ width: '26rem' }"
    @update:visible="(v) => { if (!v) extraEquitySub = null; }"
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
        <span class="text-gray-500">Equity %</span>
        <span class="font-medium">{{ formatPercentage((budgetYear?.equityPercentage ?? 0) * 100) }}</span>
      </div>
      <div class="flex justify-between py-2 font-bold text-base">
        <span>Budget Equity (target)</span>
        <span>{{ formatCurrency(gapRow?.budgetEquity ?? 0) }}</span>
      </div>
    </div>
  </Dialog>

  <!-- Extra Equity: Actual sub-dialog -->
  <Dialog
    :visible="extraEquitySub?.type === 'ee-actual'"
    modal
    :header="`Actual Equity — ${monthLabel}`"
    :style="{ width: '44rem' }"
    :content-style="{ maxHeight: '72vh', overflowY: 'auto' }"
    @update:visible="(v) => { if (!v) extraEquitySub = null; }"
  >
    <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
      All equity invested this month — includes capital recycled from your broker balance.
    </p>
    <template v-if="prefix">
      <BudgetStockPurchasesTable
        :prefix="prefix"
        :show-total="false"
      />
      <div class="border-t dark:border-gray-600 pt-2 space-y-1 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-500">Stock + ETFs</span>
          <span class="text-red-600 dark:text-red-400">{{ formatCurrency(-(trackingRow?.stockEquityEtfs ?? 0)) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">MF Equity (manual entry)</span>
          <span class="text-red-600 dark:text-red-400">{{ formatCurrency(-(trackingRow?.mfEquity ?? 0)) }}</span>
        </div>
        <div class="flex justify-between font-bold text-base pt-1 border-t dark:border-gray-600">
          <span>Actual Equity</span>
          <span class="text-red-600 dark:text-red-400">{{ formatCurrency(-(gapRow?.actualEquity ?? 0)) }}</span>
        </div>
      </div>
    </template>
  </Dialog>

  <!-- Extra Equity: Fresh sub-dialog -->
  <Dialog
    :visible="extraEquitySub?.type === 'ee-fresh'"
    modal
    :header="`Fresh Equity — ${monthLabel}`"
    :style="{ width: '32rem' }"
    @update:visible="(v) => { if (!v) { extraEquitySub = null; freshEquityDrilldown = null; } }"
  >
    <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
      Fresh equity is salary-only investment — actual equity minus the portion funded by broker cash balance.
    </p>
    <div class="space-y-1 text-sm">
      <div class="flex justify-between py-2 border-b dark:border-gray-700">
        <Button
          variant="link"
          label="Total Stock + ETF Purchases (all sources)"
          class="!p-0 underline decoration-dotted decoration-blue-400 !text-left"
          @click="freshEquityDrilldown = { type: 'fe-total-buys', monthLabel }"
        />
        <span class="text-red-600 dark:text-red-400 ml-4 shrink-0">{{ formatCurrency(-(trackingRow?.stockEquityEtfs ?? 0)) }}</span>
      </div>
      <div class="flex justify-between py-2 border-b dark:border-gray-700">
        <Button
          variant="link"
          label="Broker Cash Used for Stock + ETFs"
          class="!p-0 underline decoration-dotted decoration-amber-400 !text-amber-600 dark:!text-amber-400"
          @click="freshEquityDrilldown = { type: 'fe-recycled', monthLabel }"
        />
        <span class="text-green-600 dark:text-green-400 ml-4 shrink-0">
          {{ formatCurrency((trackingRow?.stockEquityEtfs ?? 0) - (trackingRow?.freshStockEquityEtfs ?? 0)) }}
        </span>
      </div>
      <div class="flex justify-between py-2 border-b dark:border-gray-700">
        <Button
          variant="link"
          label="Salary Used for buying Stock + ETFs"
          class="!p-0 underline decoration-dotted decoration-blue-400"
          @click="freshEquityDrilldown = { type: 'fe-fresh', monthLabel }"
        />
        <span class="text-red-600 dark:text-red-400 ml-4 shrink-0">{{ formatCurrency(-(trackingRow?.freshStockEquityEtfs ?? 0)) }}</span>
      </div>
      <div class="flex justify-between py-2 border-b dark:border-gray-700">
        <span class="text-gray-500">MF Equity (manual, not recycled)</span>
        <span class="text-red-600 dark:text-red-400">{{ formatCurrency(-(trackingRow?.mfEquity ?? 0)) }}</span>
      </div>
      <div class="flex justify-between font-bold text-base pt-2">
        <span>Fresh Equity</span>
        <span class="text-red-600 dark:text-red-400">{{ formatCurrency(-(gapRow?.freshEquity ?? 0)) }}</span>
      </div>
    </div>
  </Dialog>

  <!-- Fresh Equity: Total Stock + ETF Purchases sub-dialog -->
  <Dialog
    :visible="freshEquityDrilldown?.type === 'fe-total-buys'"
    modal
    :header="`Stock + ETF Purchases — ${freshEquityDrilldown?.monthLabel ?? ''}`"
    :style="{ width: '44rem' }"
    :content-style="{ maxHeight: '72vh', overflowY: 'auto' }"
    @update:visible="(v) => { if (!v) freshEquityDrilldown = null; }"
  >
    <BudgetStockPurchasesTable v-if="prefix" :prefix="prefix" />
  </Dialog>

  <!-- Fresh Equity: Broker Cash Used sub-dialog -->
  <Dialog
    :visible="freshEquityDrilldown?.type === 'fe-recycled'"
    modal
    :header="`Broker Cash Used for Stock + ETFs — ${freshEquityDrilldown?.monthLabel ?? ''}`"
    :style="{ width: '32rem' }"
    @update:visible="(v) => { if (!v) freshEquityDrilldown = null; }"
  >
    <template v-if="freshEquityRecycledInfo">
      <div class="space-y-0 text-sm">
        <div class="flex justify-between py-2 border-b dark:border-gray-700">
          <span class="text-gray-500">Opening cash balance</span>
          <span
            class="font-medium"
            :class="freshEquityRecycledInfo.openingBalance > 0 ? 'text-amber-600 dark:text-amber-400' : ''"
          >{{ formatCurrency(freshEquityRecycledInfo.openingBalance) }}</span>
        </div>
        <div class="flex justify-between py-2 border-b-2 dark:border-gray-600 font-semibold">
          <span class="text-gray-500">+ Sell proceeds this month</span>
          <span class="text-green-600 dark:text-green-400">{{ formatCurrency(freshEquityRecycledInfo.sellProceeds) }}</span>
        </div>
        <div class="flex justify-between py-2 border-b-2 dark:border-gray-600 font-semibold">
          <span class="text-gray-600 dark:text-gray-300">= Available before purchases</span>
          <span :class="freshEquityRecycledInfo.availableBalance > 0 ? 'text-amber-600 dark:text-amber-400' : ''">
            {{ formatCurrency(freshEquityRecycledInfo.availableBalance) }}
          </span>
        </div>
        <div class="flex justify-between py-2 border-b dark:border-gray-700">
          <span class="text-gray-500">Total purchases this month</span>
          <span class="text-red-600 dark:text-red-400">{{ formatCurrency(-freshEquityRecycledInfo.totalBuys) }}</span>
        </div>
        <div class="flex justify-between py-2 pl-4 border-b dark:border-gray-700 text-xs">
          <span class="text-gray-400">of which Stock + ETF purchases</span>
          <span class="text-gray-500">{{ formatCurrency(-freshEquityRecycledInfo.stockBuys) }}</span>
        </div>
        <div class="flex justify-between py-2 pl-4 border-b-2 dark:border-gray-600 text-xs">
          <span class="text-gray-400">of which Commodity purchases</span>
          <span class="text-gray-500">{{ formatCurrency(-freshEquityRecycledInfo.commodityBuys) }}</span>
        </div>
        <div class="flex justify-between py-2 border-b dark:border-gray-700">
          <span class="text-gray-500">Total used from broker cash</span>
          <span class="font-medium text-amber-600 dark:text-amber-400">{{ formatCurrency(freshEquityRecycledInfo.totalRecycled) }}</span>
        </div>
        <div class="flex justify-between py-2 border-b-2 border-gray-300 dark:border-gray-500 font-bold text-base">
          <span>Stock + ETF share of broker cash used</span>
          <span class="text-amber-600 dark:text-amber-400">{{ formatCurrency(freshEquityRecycledInfo.stockRecycled) }}</span>
        </div>
        <div class="flex justify-between py-2 font-semibold">
          <span class="text-gray-500">Closing cash balance</span>
          <span
            :class="
              freshEquityRecycledInfo.availableBalance - freshEquityRecycledInfo.totalRecycled > 0
                ? 'text-amber-600 dark:text-amber-400'
                : ''
            "
          >{{ formatCurrency(freshEquityRecycledInfo.availableBalance - freshEquityRecycledInfo.totalRecycled) }}</span>
        </div>
      </div>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-3">
        Broker cash is split proportionally between stock and commodity purchases. Stock share = total recycled × (stock buys ÷ total buys).
      </p>
    </template>
    <p v-else class="text-gray-400 text-sm">
      No broker cash activity this month.
    </p>
  </Dialog>

  <!-- Fresh Equity: Salary-Funded math card sub-dialog -->
  <Dialog
    :visible="freshEquityDrilldown?.type === 'fe-fresh'"
    modal
    :header="`Salary Used for buying Stock + ETFs — ${freshEquityDrilldown?.monthLabel ?? ''}`"
    :style="{ width: '28rem' }"
    @update:visible="(v) => { if (!v) freshEquityDrilldown = null; }"
  >
    <div class="space-y-0 text-sm">
      <div class="flex justify-between py-2 border-b dark:border-gray-700">
        <span class="text-gray-500">Total Stock + ETF purchases</span>
        <span class="text-red-600 dark:text-red-400 font-medium">{{ formatCurrency(-(trackingRow?.stockEquityEtfs ?? 0)) }}</span>
      </div>
      <div class="flex justify-between py-2 border-b-2 border-gray-300 dark:border-gray-500">
        <span class="text-gray-500">Broker Cash Used for Stock + ETFs</span>
        <span class="text-green-600 dark:text-green-400 font-medium">
          {{ formatCurrency((trackingRow?.stockEquityEtfs ?? 0) - (trackingRow?.freshStockEquityEtfs ?? 0)) }}
        </span>
      </div>
      <div class="flex justify-between py-2 font-bold text-base">
        <span>Salary Used for buying Stock + ETFs</span>
        <span class="text-red-600 dark:text-red-400">{{ formatCurrency(-(trackingRow?.freshStockEquityEtfs ?? 0)) }}</span>
      </div>
    </div>
    <p class="text-xs text-gray-400 dark:text-gray-500 mt-3">
      Only the salary-funded portion counts toward the budget gap analysis.
    </p>
  </Dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '~/stores/data'
import { formatCurrency, formatPercentage } from '~/composables/useCalculations'
import { calcBrokerBalanceHistory } from '~/composables/useBudgetCalculations'

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

const store = useDataStore()

const extraEquitySub = ref(null)
const freshEquityDrilldown = ref(null)

const prefix = computed(() => {
  if (!props.year || !props.month) return null
  return `${props.year}-${String(props.month).padStart(2, '0')}`
})

const freshEquityRecycledInfo = computed(() => {
  if (freshEquityDrilldown.value?.type !== 'fe-recycled') return null
  const p = prefix.value
  if (!p || !props.year || !props.month) return null
  const history = calcBrokerBalanceHistory(store, props.year, props.month)
  const idx = history.findIndex((r) => r.prefix === p)
  if (idx < 0) return null
  const hRow = history[idx]
  const openingBalance = idx > 0 ? history[idx - 1].balance : 0
  const tr = props.trackingRow
  return {
    openingBalance,
    sellProceeds: hRow.sellProceeds,
    availableBalance: openingBalance + hRow.sellProceeds,
    totalBuys: hRow.totalBuys,
    totalRecycled: hRow.recycled,
    stockBuys: tr?.stockEquityEtfs ?? 0,
    commodityBuys: tr?.commodities ?? 0,
    stockRecycled: (tr?.stockEquityEtfs ?? 0) - (tr?.freshStockEquityEtfs ?? 0),
    freshStockEquityEtfs: tr?.freshStockEquityEtfs ?? 0,
  }
})
</script>
