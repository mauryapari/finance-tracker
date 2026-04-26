<template>
  <div class="flex flex-col px-4 gap-6 py-4 overflow-auto">
    <!-- Year selector -->
    <div class="flex items-center gap-3">
      <Select
        v-model="selectedYear"
        :options="availableYears"
        placeholder="Select year…"
        class="w-36"
      />
      <Button
        icon="pi pi-plus"
        label="Add Year"
        size="small"
        @click="yearDialogMode = 'add'"
      />
    </div>

    <!-- No year selected -->
    <p v-if="!budgetYear" class="text-gray-500 dark:text-gray-400 text-sm">
      Select a year above or click "Add Year" to create a new budget config.
    </p>

    <BudgetConfigCard
      v-if="budgetYear"
      :budget-year="budgetYear"
      :selected-year="selectedYear"
      @edit="yearDialogMode = 'edit'"
    />

    <BudgetMonthlyTable
      v-if="budgetYear"
      :tracking-rows="trackingRows"
      :tracking-totals="trackingTotals"
      :selected-year="selectedYear"
      @open-drilldown="openDrilldown"
    />

    <BudgetGapAnalysisTable
      v-if="budgetYear"
      :gap-rows="gapRows"
      :gap-totals="gapTotals"
      @open-gap-drilldown="openGapDrilldown"
    />

    <component
      v-if="activeDrilldown"
      :is="activeDrilldown.component"
      v-bind="activeDrilldown.props"
      :visible="true"
      @close="drilldown = null"
    />

    <BudgetYearDialog
      :visible="yearDialogMode !== null"
      :mode="yearDialogMode"
      :budget-year="budgetYear"
      @close="yearDialogMode = null"
      @saved="onYearSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useDataStore } from '~/stores/data'
import BudgetStocksDrilldown from '~/components/Budget/StocksDrilldown.vue'
import BudgetSellsDrilldown from '~/components/Budget/SellsDrilldown.vue'
import BudgetTotalDrilldown from '~/components/Budget/TotalDrilldown.vue'
import BudgetBalanceHistory from '~/components/Budget/BalanceHistory.vue'
import BudgetGapEquityDialogs from '~/components/Budget/GapEquityDialogs.vue'
import BudgetGapDebtDialog from '~/components/Budget/GapDebtDialog.vue'
import BudgetGapCommoditiesDialogs from '~/components/Budget/GapCommoditiesDialogs.vue'
import {
  calcStockEquityEtfsBreakdown,
  calcCommodityGold,
  calcCommoditySilver,
  calcStockProfitBooked,
  calcBrokerRunningBalance,
} from '~/composables/useBudgetCalculations'

const store = useDataStore()

// ── Year selection ─────────────────────────────────────────────────────────
const selectedYear = ref(null)

const availableYears = computed(() =>
  store.tables.budgetYears.map((r) => r.year).sort((a, b) => b - a),
)

const budgetYear = computed(
  () => store.tables.budgetYears.find((r) => r.year === selectedYear.value) ?? null,
)

const currentYear = new Date().getFullYear()
watch(
  availableYears,
  (years) => {
    if (!selectedYear.value && years.includes(currentYear)) {
      selectedYear.value = currentYear
    }
  },
  { immediate: true },
)

// ── Monthly tracking rows ──────────────────────────────────────────────────
const trackingRows = computed(() => {
  if (!selectedYear.value) return []
  const balanceData = calcBrokerRunningBalance(store, selectedYear.value)
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const stored = store.tables.budgetMonthly.find(
      (r) => r.year === selectedYear.value && r.month === month,
    )
    const mfEquity = stored?.mfEquity ?? 0
    const ppf = stored?.ppf ?? 0
    const stockEquityEtfsBreakdown = calcStockEquityEtfsBreakdown(store, selectedYear.value, month)
    const stockEquityEtfs =
      stockEquityEtfsBreakdown.openPositions +
      stockEquityEtfsBreakdown.closedPositions +
      stockEquityEtfsBreakdown.etfs
    const commoditiesGold = calcCommodityGold(store, selectedYear.value, month)
    const commoditiesSilver = calcCommoditySilver(store, selectedYear.value, month)
    const commodities = commoditiesGold + commoditiesSilver
    const totalEquity = stockEquityEtfs + mfEquity
    const totalDebt = ppf
    const totalCommodities = commodities
    const total = totalEquity + totalDebt + totalCommodities
    const bal = balanceData[i]
    return {
      _storedId: stored?.id ?? null,
      month,
      monthLabel: `${selectedYear.value}-${String(month).padStart(2, '0')}`,
      mfEquity,
      ppf,
      stockEquityEtfs,
      stockEquityEtfsBreakdown,
      commoditiesGold,
      commoditiesSilver,
      commodities,
      investedEquityPercentage: total > 0 ? (totalEquity / total) * 100 : 0,
      debtPercentage: total > 0 ? (totalDebt / total) * 100 : 0,
      commoditiesPercentage: total > 0 ? (totalCommodities / total) * 100 : 0,
      totalEquity,
      totalDebt,
      totalCommodities,
      total,
      stockProfitBooked: calcStockProfitBooked(store, selectedYear.value, month),
      sellProceeds: bal.sellProceeds,
      brokerBalance: bal.brokerBalance,
      freshStockEquityEtfs: bal.freshStockEquityEtfs,
      freshCommodities: bal.freshCommodities,
    }
  })
})

const trackingTotals = computed(() => {
  const keys = [
    'stockEquityEtfs',
    'mfEquity',
    'ppf',
    'commoditiesGold',
    'commoditiesSilver',
    'commodities',
    'totalEquity',
    'totalDebt',
    'totalCommodities',
    'total',
    'stockProfitBooked',
    'sellProceeds',
    'freshStockEquityEtfs',
    'freshCommodities',
  ]
  const result = {}
  for (const key of keys) {
    result[key] = trackingRows.value.reduce((s, r) => s + (r[key] || 0), 0)
  }
  return result
})

// ── Gap analysis rows ──────────────────────────────────────────────────────
const gapRows = computed(() => {
  if (!budgetYear.value) return []
  const { totalMonthly, equityPercentage, debtPercentage, commodityPercentage } = budgetYear.value
  const budgetEquity = totalMonthly * equityPercentage
  const budgetDebt = totalMonthly * debtPercentage
  const budgetCommodities = totalMonthly * commodityPercentage
  return trackingRows.value.map((r) => {
    const freshEquity = r.freshStockEquityEtfs + r.mfEquity
    const freshCommodities = r.freshCommodities
    return {
      month: r.month,
      monthLabel: r.monthLabel,
      budgetEquity,
      actualEquity: r.totalEquity,
      freshEquity,
      extraEquity: freshEquity - budgetEquity,
      budgetDebt,
      actualDebt: r.totalDebt,
      extraDebt: r.totalDebt - budgetDebt,
      budgetCommodities,
      actualCommodities: r.totalCommodities,
      freshCommodities,
      extraCommodities: freshCommodities - budgetCommodities,
    }
  })
})

const gapTotals = computed(() => {
  const keys = [
    'budgetEquity',
    'actualEquity',
    'freshEquity',
    'extraEquity',
    'budgetDebt',
    'actualDebt',
    'extraDebt',
    'budgetCommodities',
    'actualCommodities',
    'freshCommodities',
    'extraCommodities',
  ]
  const result = {}
  for (const key of keys) {
    result[key] = gapRows.value.reduce((s, r) => s + (r[key] || 0), 0)
  }
  return result
})

// ── Drill-down dialogs ─────────────────────────────────────────────────────
const drilldown = ref(null)

function openDrilldown(type, row) {
  drilldown.value = {
    type,
    year: selectedYear.value,
    month: row.month,
    monthLabel: row.monthLabel,
  }
}

function openGapDrilldown(type, gapRow) {
  const trackingRow = trackingRows.value.find((r) => r.month === gapRow.month) ?? null
  drilldown.value = {
    type,
    year: selectedYear.value,
    month: gapRow.month,
    monthLabel: gapRow.monthLabel,
    gapRow: { ...gapRow },
    trackingRow: trackingRow ? { ...trackingRow } : null,
  }
}

const drilldownProps = computed(() => ({
  year: drilldown.value?.year ?? null,
  month: drilldown.value?.month ?? null,
  monthLabel: drilldown.value?.monthLabel ?? '',
}))

const gapDrilldownProps = computed(() => ({
  ...drilldownProps.value,
  gapRow: drilldown.value?.gapRow ?? null,
  trackingRow: drilldown.value?.trackingRow ?? null,
  budgetYear: budgetYear.value,
}))

const totalDrilldownRow = computed(() =>
  drilldown.value?.type === 'total'
    ? (trackingRows.value.find((r) => r.month === drilldown.value.month) ?? null)
    : null,
)

const activeDrilldown = computed(() => {
  if (!drilldown.value) return null
  const map = {
    stocks: { component: BudgetStocksDrilldown, props: drilldownProps.value },
    sells: { component: BudgetSellsDrilldown, props: drilldownProps.value },
    total: { component: BudgetTotalDrilldown, props: { ...drilldownProps.value, trackingRow: totalDrilldownRow.value } },
    balance: { component: BudgetBalanceHistory, props: drilldownProps.value },
    'gap-extra-equity': { component: BudgetGapEquityDialogs, props: gapDrilldownProps.value },
    'gap-extra-debt': { component: BudgetGapDebtDialog, props: gapDrilldownProps.value },
    'gap-extra-comm': { component: BudgetGapCommoditiesDialogs, props: gapDrilldownProps.value },
  }
  return map[drilldown.value.type] ?? null
})

// ── Year dialog ────────────────────────────────────────────────────────────
const yearDialogMode = ref(null)

function onYearSaved(year) {
  selectedYear.value = year
}
</script>
