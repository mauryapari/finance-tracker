<template>
  <Dialog
    :visible="visible"
    modal
    :header="`Broker Cash Balance History — through ${monthLabel}`"
    :style="{ width: '52rem' }"
    :content-style="{ maxHeight: '72vh', overflowY: 'auto' }"
    @update:visible="(v) => { if (!v) $emit('close') }"
  >
    <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
      Each month: sell proceeds are added to the broker cash balance, then
      purchases draw from it (used from cash balance) before counting as fresh
      salary.
    </p>
    <table class="w-full text-sm">
      <thead>
        <tr class="text-xs text-gray-400 border-b dark:border-gray-600">
          <th class="text-left py-1 pr-3">Month</th>
          <th class="text-right py-1 pr-3">Sell Proceeds</th>
          <th class="text-right py-1 pr-3">Total Purchases</th>
          <th class="text-right py-1 pr-3">Used from Cash Balance</th>
          <th class="text-right py-1">Closing Cash Balance</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="row in displayRows" :key="row.isYearSummary ? row.year : row.prefix">
          <!-- Year summary row for past years -->
          <tr
            v-if="row.isYearSummary"
            class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
          >
            <td class="py-1 pr-3">
              <button
                class="flex items-center gap-1 font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                :aria-label="`View monthly breakdown for ${row.year}`"
                @click="yearDrilldown = row"
              >
                <span class="font-mono">{{ row.year }}</span>
                <span class="text-xs text-gray-400">▶</span>
              </button>
            </td>
            <td class="py-1 pr-3 text-right">
              <Button
                v-if="row.sellProceeds > 0"
                variant="link"
                :label="formatCurrency(row.sellProceeds)"
                class="!p-0 underline decoration-dotted decoration-green-400 !text-green-600 dark:!text-green-400"
                :aria-label="`View ${row.year} sell proceeds breakdown`"
                @click="yearDrilldown = row"
              />
              <span v-else class="text-gray-400">—</span>
            </td>
            <td class="py-1 pr-3 text-right">
              <Button
                v-if="row.totalBuys > 0"
                variant="link"
                :label="formatCurrency(-row.totalBuys)"
                class="!p-0 underline decoration-dotted decoration-red-400 !text-red-600 dark:!text-red-400"
                :aria-label="`View ${row.year} purchases breakdown`"
                @click="yearDrilldown = row"
              />
              <span v-else class="text-gray-400">—</span>
            </td>
            <td class="py-1 pr-3 text-right">
              <Button
                v-if="row.recycled > 0"
                variant="link"
                :label="formatCurrency(row.recycled)"
                class="!p-0 underline decoration-dotted decoration-amber-400 !text-amber-600 dark:!text-amber-400"
                :aria-label="`View ${row.year} cash balance drawdown breakdown`"
                @click="yearDrilldown = row"
              />
              <span v-else class="text-gray-400">—</span>
            </td>
            <td
              class="py-1 text-right"
              :class="row.balance > 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''"
            >
              {{ formatCurrency(row.balance) }}
            </td>
          </tr>
          <!-- Individual month row for the selected year -->
          <tr
            v-else
            class="border-b border-gray-50 dark:border-gray-700"
            :class="row.prefix === currentPrefix ? 'bg-blue-50 dark:bg-blue-900/20 font-semibold' : ''"
          >
            <td class="py-1 pr-3 font-mono">{{ row.prefix }}</td>
            <td class="py-1 pr-3 text-right">
              <Button
                v-if="row.sellProceeds > 0"
                variant="link"
                :label="formatCurrency(row.sellProceeds)"
                class="!p-0 underline decoration-dotted decoration-green-400 !text-green-600 dark:!text-green-400"
                @click="historyRowDrilldown = { type: 'hr-sells', prefix: row.prefix, monthLabel: row.prefix }"
              />
              <span v-else class="text-gray-400">—</span>
            </td>
            <td class="py-1 pr-3 text-right">
              <Button
                v-if="row.totalBuys > 0"
                variant="link"
                :label="formatCurrency(-row.totalBuys)"
                class="!p-0 underline decoration-dotted decoration-red-400 !text-red-600 dark:!text-red-400"
                @click="historyRowDrilldown = { type: 'hr-buys', prefix: row.prefix, monthLabel: row.prefix }"
              />
              <span v-else class="text-gray-400">—</span>
            </td>
            <td class="py-1 pr-3 text-right">
              <Button
                v-if="row.recycled > 0"
                variant="link"
                :label="formatCurrency(row.recycled)"
                class="!p-0 underline decoration-dotted decoration-amber-400 !text-amber-600 dark:!text-amber-400"
                @click="historyRowDrilldown = { type: 'hr-recycled', prefix: row.prefix, monthLabel: row.prefix }"
              />
              <span v-else class="text-gray-400">—</span>
            </td>
            <td
              class="py-1 text-right"
              :class="row.balance > 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''"
            >
              {{ formatCurrency(row.balance) }}
            </td>
          </tr>
        </template>
      </tbody>
      <tfoot v-if="balanceHistory.length">
        <tr class="font-semibold border-t dark:border-gray-500 text-sm">
          <td class="pt-1 pr-3 text-gray-500">Total</td>
          <td class="pt-1 pr-3 text-right text-green-600 dark:text-green-400">
            {{ formatCurrency(balanceHistory.reduce((s, r) => s + r.sellProceeds, 0)) }}
          </td>
          <td class="pt-1 pr-3 text-right text-red-600 dark:text-red-400">
            {{ formatCurrency(-balanceHistory.reduce((s, r) => s + r.totalBuys, 0)) }}
          </td>
          <td class="pt-1 pr-3 text-right text-amber-600 dark:text-amber-400">
            {{ formatCurrency(balanceHistory.reduce((s, r) => s + r.recycled, 0)) }}
          </td>
          <td class="pt-1 text-right" />
        </tr>
      </tfoot>
    </table>
    <p v-if="!balanceHistory.length" class="text-gray-400 text-sm mt-2">
      No broker activity found.
    </p>
  </Dialog>

  <!-- Year Monthly Breakdown Dialog -->
  <Dialog
    :visible="!!yearDrilldown"
    modal
    :header="yearDrilldown ? `Monthly Breakdown — ${yearDrilldown.year}` : ''"
    :style="{ width: '52rem' }"
    :content-style="{ maxHeight: '72vh', overflowY: 'auto' }"
    @update:visible="(v) => { if (!v) yearDrilldown = null }"
  >
    <table v-if="yearDrilldown" class="w-full text-sm">
      <thead>
        <tr class="text-xs text-gray-400 border-b dark:border-gray-600">
          <th class="text-left py-1 pr-3">Month</th>
          <th class="text-right py-1 pr-3">Sell Proceeds</th>
          <th class="text-right py-1 pr-3">Total Purchases</th>
          <th class="text-right py-1 pr-3">Used from Cash Balance</th>
          <th class="text-right py-1">Closing Cash Balance</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in yearDrilldown.months"
          :key="row.prefix"
          class="border-b border-gray-50 dark:border-gray-700"
        >
          <td class="py-1 pr-3 font-mono">{{ row.prefix }}</td>
          <td class="py-1 pr-3 text-right">
            <Button
              v-if="row.sellProceeds > 0"
              variant="link"
              :label="formatCurrency(row.sellProceeds)"
              class="!p-0 underline decoration-dotted decoration-green-400 !text-green-600 dark:!text-green-400"
              @click="historyRowDrilldown = { type: 'hr-sells', prefix: row.prefix, monthLabel: row.prefix }"
            />
            <span v-else class="text-gray-400">—</span>
          </td>
          <td class="py-1 pr-3 text-right">
            <Button
              v-if="row.totalBuys > 0"
              variant="link"
              :label="formatCurrency(-row.totalBuys)"
              class="!p-0 underline decoration-dotted decoration-red-400 !text-red-600 dark:!text-red-400"
              @click="historyRowDrilldown = { type: 'hr-buys', prefix: row.prefix, monthLabel: row.prefix }"
            />
            <span v-else class="text-gray-400">—</span>
          </td>
          <td class="py-1 pr-3 text-right">
            <Button
              v-if="row.recycled > 0"
              variant="link"
              :label="formatCurrency(row.recycled)"
              class="!p-0 underline decoration-dotted decoration-amber-400 !text-amber-600 dark:!text-amber-400"
              @click="historyRowDrilldown = { type: 'hr-recycled', prefix: row.prefix, monthLabel: row.prefix }"
            />
            <span v-else class="text-gray-400">—</span>
          </td>
          <td
            class="py-1 text-right"
            :class="row.balance > 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''"
          >
            {{ formatCurrency(row.balance) }}
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="font-semibold border-t dark:border-gray-500 text-sm">
          <td class="pt-1 pr-3 text-gray-500">Year Total</td>
          <td class="pt-1 pr-3 text-right text-green-600 dark:text-green-400">
            {{ formatCurrency(yearDrilldown.sellProceeds) }}
          </td>
          <td class="pt-1 pr-3 text-right text-red-600 dark:text-red-400">
            {{ formatCurrency(-yearDrilldown.totalBuys) }}
          </td>
          <td class="pt-1 pr-3 text-right text-amber-600 dark:text-amber-400">
            {{ formatCurrency(yearDrilldown.recycled) }}
          </td>
          <td class="pt-1 text-right" />
        </tr>
      </tfoot>
    </table>
  </Dialog>

  <!-- History Row: Sell Proceeds Sub-dialog -->
  <Dialog
    :visible="historyRowDrilldown?.type === 'hr-sells'"
    modal
    :header="`Sell Proceeds — ${historyRowDrilldown?.monthLabel ?? ''}`"
    :style="{ width: '44rem' }"
    :content-style="{ maxHeight: '72vh', overflowY: 'auto' }"
    @update:visible="(v) => { if (!v) historyRowDrilldown = null }"
  >
    <BudgetSellProceedsTable v-if="historyRowSellsPrefix" :prefix="historyRowSellsPrefix" />
  </Dialog>

  <!-- History Row: Total Purchases Sub-dialog -->
  <Dialog
    :visible="historyRowDrilldown?.type === 'hr-buys'"
    modal
    :header="`Total Purchases — ${historyRowDrilldown?.monthLabel ?? ''}`"
    :style="{ width: '44rem' }"
    :content-style="{ maxHeight: '72vh', overflowY: 'auto' }"
    @update:visible="(v) => { if (!v) historyRowDrilldown = null }"
  >
    <template v-if="historyRowBuysPrefix">
      <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Stocks &amp; ETFs</p>
      <BudgetStockPurchasesTable :prefix="historyRowBuysPrefix" :show-total="false" />

      <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 mt-2">Commodities</p>
      <BudgetCommodityPurchasesTable :prefix="historyRowBuysPrefix" />

      <div class="border-t dark:border-gray-600 pt-2 mt-2 flex justify-between font-bold text-base">
        <span>Total Purchases</span>
        <span class="text-red-600 dark:text-red-400">{{ formatCurrency(-historyRowTotalBuys) }}</span>
      </div>
    </template>
  </Dialog>

  <!-- History Row: Cash Balance Drawdown Sub-dialog -->
  <Dialog
    :visible="historyRowDrilldown?.type === 'hr-recycled'"
    modal
    :header="`Cash Balance Drawdown — ${historyRowDrilldown?.monthLabel ?? ''}`"
    :style="{ width: '28rem' }"
    @update:visible="(v) => { if (!v) historyRowDrilldown = null }"
  >
    <template v-if="historyRowRecycledInfo">
      <div class="space-y-0 text-sm">
        <div class="flex justify-between py-2 border-b dark:border-gray-700">
          <span class="text-gray-500">Opening cash balance</span>
          <span
            class="font-medium"
            :class="historyRowRecycledInfo.openingBalance > 0 ? 'text-amber-600 dark:text-amber-400' : ''"
          >{{ formatCurrency(historyRowRecycledInfo.openingBalance) }}</span>
        </div>
        <div class="flex justify-between py-2 border-b dark:border-gray-700">
          <span class="text-gray-500">+ Sell proceeds this month</span>
          <span class="font-medium text-green-600 dark:text-green-400">{{ formatCurrency(historyRowRecycledInfo.sellProceeds) }}</span>
        </div>
        <div class="flex justify-between py-2 border-b-2 dark:border-gray-600 font-semibold">
          <span class="text-gray-600 dark:text-gray-300">= Available before purchases</span>
          <span :class="historyRowRecycledInfo.availableBalance > 0 ? 'text-amber-600 dark:text-amber-400' : ''">
            {{ formatCurrency(historyRowRecycledInfo.availableBalance) }}
          </span>
        </div>
        <div class="flex justify-between py-2 border-b dark:border-gray-700">
          <span class="text-gray-500">Total purchases this month</span>
          <span class="font-medium text-red-600 dark:text-red-400">{{ formatCurrency(-historyRowRecycledInfo.totalBuys) }}</span>
        </div>
        <div class="flex justify-between py-2 border-b-2 border-gray-300 dark:border-gray-500 font-bold text-base">
          <span>Used from cash balance</span>
          <span class="text-amber-600 dark:text-amber-400">{{ formatCurrency(historyRowRecycledInfo.recycled) }}</span>
        </div>
        <div class="flex justify-between py-2 font-semibold">
          <span class="text-gray-500">Closing cash balance</span>
          <span :class="historyRowRecycledInfo.closingBalance > 0 ? 'text-amber-600 dark:text-amber-400' : ''">
            {{ formatCurrency(historyRowRecycledInfo.closingBalance) }}
          </span>
        </div>
      </div>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-3">
        Used from cash balance = min(available, total purchases). Fresh salary
        = total purchases − used from cash balance.
      </p>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '~/stores/data'
import { formatCurrency } from '~/composables/useCalculations'
import { calcBrokerBalanceHistory } from '~/composables/useBudgetCalculations'

const props = defineProps({
  visible: { type: Boolean, required: true },
  year: { type: Number, default: null },
  month: { type: Number, default: null },
  monthLabel: { type: String, default: '' },
})

defineEmits(['close'])

const store = useDataStore()
const historyRowDrilldown = ref(null)
const yearDrilldown = ref(null)

const currentPrefix = computed(() => {
  if (!props.year || !props.month) return null
  return `${props.year}-${String(props.month).padStart(2, '0')}`
})

const balanceHistory = computed(() => {
  if (!props.visible || !props.year || !props.month) return []
  return calcBrokerBalanceHistory(store, props.year, props.month)
})

const displayRows = computed(() => {
  const rows = balanceHistory.value
  const selectedYear = props.year
  if (!rows.length) return []

  const byYear = {}
  for (const row of rows) {
    const y = Number(row.prefix.split('-')[0])
    if (!byYear[y]) byYear[y] = []
    byYear[y].push(row)
  }

  const result = []
  for (const y of Object.keys(byYear).map(Number).sort()) {
    const yearRows = byYear[y]
    if (y === selectedYear) {
      result.push(...yearRows)
    } else {
      result.push({
        isYearSummary: true,
        year: y,
        sellProceeds: yearRows.reduce((s, r) => s + r.sellProceeds, 0),
        totalBuys: yearRows.reduce((s, r) => s + r.totalBuys, 0),
        recycled: yearRows.reduce((s, r) => s + r.recycled, 0),
        balance: yearRows[yearRows.length - 1].balance,
        months: yearRows,
      })
    }
  }
  return result
})

const historyRowSellsPrefix = computed(() =>
  historyRowDrilldown.value?.type === 'hr-sells' ? historyRowDrilldown.value.prefix : null
)

const historyRowBuysPrefix = computed(() =>
  historyRowDrilldown.value?.type === 'hr-buys' ? historyRowDrilldown.value.prefix : null
)

const historyRowTotalBuys = computed(() => {
  const p = historyRowBuysPrefix.value
  if (!p) return 0
  return (
    store.tables.openPositions.filter((r) => r.buyDate?.startsWith(p)).reduce((s, r) => s + r.buyPrice * r.qty, 0) +
    store.tables.closedPositions.filter((r) => r.buyDate?.startsWith(p)).reduce((s, r) => s + r.buyRate * r.qty, 0) +
    store.tables.etfs.filter((r) => r.buyDate?.startsWith(p)).reduce((s, r) => s + r.buyPrice * r.qty, 0) +
    store.tables.commodityEtfs.filter((r) => r.buyDate?.startsWith(p)).reduce((s, r) => s + r.buyPrice * r.qty, 0) +
    store.tables.closedCommodityEtfs.filter((r) => r.buyDate?.startsWith(p)).reduce((s, r) => s + r.buyRate * r.qty, 0)
  )
})

const historyRowRecycledInfo = computed(() => {
  if (historyRowDrilldown.value?.type !== 'hr-recycled') return null
  const prefix = historyRowDrilldown.value.prefix
  const idx = balanceHistory.value.findIndex((r) => r.prefix === prefix)
  if (idx < 0) return null
  const row = balanceHistory.value[idx]
  const openingBalance = idx > 0 ? balanceHistory.value[idx - 1].balance : 0
  return {
    openingBalance,
    sellProceeds: row.sellProceeds,
    availableBalance: openingBalance + row.sellProceeds,
    totalBuys: row.totalBuys,
    recycled: row.recycled,
    closingBalance: row.balance,
  }
})
</script>
