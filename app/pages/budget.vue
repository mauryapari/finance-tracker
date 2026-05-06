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
      :selected-year="selectedYear ?? 0"
      @edit="yearDialogMode = 'edit'"
    />

    <BudgetMonthlyTable
      v-if="budgetYear"
      :tracking-rows="trackingRows"
      :tracking-totals="trackingTotals"
      :selected-year="selectedYear ?? 0"
      :budget-year="budgetYear"
      @open-drilldown="openDrilldown"
    />

    <BudgetGapAnalysisTable
      v-if="budgetYear"
      :gap-rows="gapRows"
      :gap-totals="gapTotals"
      @open-gap-drilldown="openGapDrilldown"
    />

    <component
      :is="activeDrilldown.component"
      v-if="activeDrilldown"
      v-bind="activeDrilldown.props"
      :visible="true"
      @close="drilldown = null"
    />

    <BudgetYearDialog
      :visible="yearDialogMode !== null"
      :mode="yearDialogMode ?? undefined"
      :budget-year="budgetYear ?? undefined"
      @close="yearDialogMode = null"
      @saved="onYearSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent } from 'vue'
import type { TrackingRow, GapRow } from '~/types'
import { useDataStore } from '~/stores/data'
import {
  calcStockEquityEtfsBreakdown,
  calcCommodityGold,
  calcCommoditySilver,
  calcStockProfitBooked,
  calcBrokerRunningBalance,
} from '~/composables/useBudgetCalculations'
const BudgetStocksDrilldown       = defineAsyncComponent(() => import('~/components/Budget/StocksDrilldown.vue'))
const BudgetSellsDrilldown        = defineAsyncComponent(() => import('~/components/Budget/SellsDrilldown.vue'))
const BudgetTotalDrilldown        = defineAsyncComponent(() => import('~/components/Budget/TotalDrilldown.vue'))
const BudgetBalanceHistory        = defineAsyncComponent(() => import('~/components/Budget/BalanceHistory.vue'))
const BudgetGapEquityDialogs      = defineAsyncComponent(() => import('~/components/Budget/GapEquityDialogs.vue'))
const BudgetGapDebtDialog         = defineAsyncComponent(() => import('~/components/Budget/GapDebtDialog.vue'))
const BudgetGapCommoditiesDialogs = defineAsyncComponent(() => import('~/components/Budget/GapCommoditiesDialogs.vue'))


const store = useDataStore()

interface DrilldownState {
  type: string
  year: number | null
  month: number
  monthLabel: string
  gapRow?: GapRow
  trackingRow?: TrackingRow | null
}

// ── Year selection ─────────────────────────────────────────────────────────
const selectedYear = ref<number | null>(null)

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
  const year = selectedYear.value
  if (!year) return []
  const balanceData = calcBrokerRunningBalance(store, year)
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const stored = store.tables.budgetMonthly.find(
      (r) => r.year === year && r.month === month,
    )
    const mfEquityOverride = stored?.mfEquity ?? null
    const ppfOverride = stored?.ppf ?? null
    const mfEquity = mfEquityOverride ?? budgetYear.value?.mfEquity ?? 0
    const ppf = ppfOverride ?? budgetYear.value?.ppf ?? 0
    const monthlyBudget = stored?.totalMonthly ?? null
    const stockEquityEtfsBreakdown = calcStockEquityEtfsBreakdown(store, year, month)
    const stockEquityEtfs =
      stockEquityEtfsBreakdown.openPositions +
      stockEquityEtfsBreakdown.closedPositions +
      stockEquityEtfsBreakdown.etfs
    const commoditiesGold = calcCommodityGold(store, year, month)
    const commoditiesSilver = calcCommoditySilver(store, year, month)
    const commodities = commoditiesGold + commoditiesSilver
    const totalEquity = stockEquityEtfs + mfEquity
    const totalDebt = ppf
    const totalCommodities = commodities
    const total = totalEquity + totalDebt + totalCommodities
    const bal = balanceData[i] ?? { freshStockEquityEtfs: 0, freshCommodities: 0, sellProceeds: 0, brokerBalance: 0 }
    return {
      _storedId: stored?.id ?? null,
      month,
      monthLabel: `${year}-${String(month).padStart(2, '0')}`,
      monthlyBudget,
      mfEquityOverride,
      ppfOverride,
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
      stockProfitBooked: calcStockProfitBooked(store, year, month),
      sellProceeds: bal.sellProceeds,
      brokerBalance: bal.brokerBalance,
      freshStockEquityEtfs: bal.freshStockEquityEtfs,
      freshCommodities: bal.freshCommodities,
    }
  })
})

const trackingTotals = computed(() => {
  const keys: (keyof TrackingRow)[] = [
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
  const result: Record<string, number> = {}
  for (const key of keys) {
    result[key] = trackingRows.value.reduce((s, r) => s + ((r[key] as number) || 0), 0)
  }
  return result
})

// ── Gap analysis rows ──────────────────────────────────────────────────────
const gapRows = computed(() => {
  const by = budgetYear.value
  if (!by) return []
  const { equityPercentage, debtPercentage, commodityPercentage } = by
  return trackingRows.value.map((r) => {
    const totalMonthly = r.monthlyBudget ?? by.totalMonthly
    const budgetEquity = totalMonthly * equityPercentage
    const budgetDebt = totalMonthly * debtPercentage
    const budgetCommodities = totalMonthly * commodityPercentage
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
  const keys: (keyof GapRow)[] = [
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
  const result: Record<string, number> = {}
  for (const key of keys) {
    result[key] = gapRows.value.reduce((s, r) => s + ((r[key] as number) || 0), 0)
  }
  return result
})

// ── Drill-down dialogs ─────────────────────────────────────────────────────
const drilldown = ref<DrilldownState | null>(null)

function openDrilldown(type: string, row: TrackingRow) {
  drilldown.value = {
    type,
    year: selectedYear.value,
    month: row.month,
    monthLabel: row.monthLabel,
  }
}

function openGapDrilldown(type: string, gapRow: GapRow) {
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

const totalDrilldownRow = computed(() => {
  const d = drilldown.value
  return d?.type === 'total'
    ? (trackingRows.value.find((r) => r.month === d.month) ?? null)
    : null
})

const activeDrilldown = computed(() => {
  if (!drilldown.value) return null
  const map: Record<string, { component: unknown; props: Record<string, unknown> }> = {
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
const yearDialogMode = ref<'add' | 'edit' | null>(null)

function onYearSaved(year: number) {
  selectedYear.value = year
}
</script>
