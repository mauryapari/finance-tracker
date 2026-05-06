<template>
  <div>
    <h2 class="text-base font-semibold text-gray-700 dark:text-gray-200 mb-2">
      Monthly Investment Tracking
    </h2>
    <div
      class="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 flex gap-2 mb-3"
    >
      <i class="pi pi-info-circle mt-0.5 flex-shrink-0" />
      <span>
        <b>Sell Proceeds</b> — cash received into your broker account when
        positions were closed this month (sell price × qty).
        <br >
        <b>Broker Cash Balance</b> — running cash balance in your broker
        account; new purchases draw from this first before counting as fresh
        salary in the gap analysis. Click either cell to see the full
        breakdown.
      </span>
    </div>
    <DataTable
      v-model:editing-rows="editingTrackingRows"
      :value="trackingRows"
      edit-mode="row"
      data-key="month"
      show-gridlines
      striped-rows
      scrollable
      size="small"
      class="text-sm"
    >
      <Column field="monthLabel" header="Month" frozen class="min-w-24 font-medium" />
      <Column field="monthlyBudget" header="Monthly Budget" class="min-w-36">
        <template #body="{ data }">
          <span v-if="data.monthlyBudget != null">{{ formatCurrency(data.monthlyBudget) }}</span>
          <span v-else class="text-gray-400 dark:text-gray-500 text-xs italic">month default</span>
        </template>
        <template #editor="{ data, field }">
          <InputNumber
            v-model="data[field]"
            :min-fraction-digits="0"
            placeholder="blank = month default"
            size="small"
            class="w-full"
            aria-label="Monthly budget override"
          />
        </template>
      </Column>
      <Column field="stockEquityEtfs" header="Stock+ETFs" class="min-w-32">
        <template #body="{ data }">
          <Button
            v-tooltip.top="{
              value: stockEtfsTooltip(data.stockEquityEtfsBreakdown),
              escape: false,
              showDelay: 300,
            }"
            variant="text"
            severity="info"
            :label="formatCurrency(data.stockEquityEtfs)"
            class="!p-0 underline decoration-dotted !decoration-blue-400"
            @click="$emit('open-drilldown', 'stocks', data)"
          />
        </template>
      </Column>
      <Column field="mfEquityOverride" header="MF Equity" class="min-w-32">
        <template #body="{ data }">
          <span v-if="data.mfEquityOverride != null">{{ formatCurrency(data.mfEquity) }}</span>
          <span v-else class="text-gray-400 dark:text-gray-500 text-xs italic">year default</span>
        </template>
        <template #editor="{ data, field }">
          <InputNumber
            v-model="data[field]"
            :min-fraction-digits="2"
            placeholder="blank = year default"
            size="small"
            class="w-full"
            aria-label="MF Equity override"
          />
        </template>
      </Column>
      <Column field="ppfOverride" header="PPF" class="min-w-28">
        <template #body="{ data }">
          <span v-if="data.ppfOverride != null">{{ formatCurrency(data.ppf) }}</span>
          <span v-else class="text-gray-400 dark:text-gray-500 text-xs italic">year default</span>
        </template>
        <template #editor="{ data, field }">
          <InputNumber
            v-model="data[field]"
            :min-fraction-digits="2"
            placeholder="blank = year default"
            size="small"
            class="w-full"
            aria-label="PPF override"
          />
        </template>
      </Column>
      <Column field="commoditiesGold" header="Gold" class="min-w-28">
        <template #body="{ data }">{{ formatCurrency(data.commoditiesGold) }}</template>
      </Column>
      <Column field="commoditiesSilver" header="Silver" class="min-w-28">
        <template #body="{ data }">{{ formatCurrency(data.commoditiesSilver) }}</template>
      </Column>
      <Column field="commodities" header="Commodities" class="min-w-32">
        <template #body="{ data }">{{ formatCurrency(data.commodities) }}</template>
      </Column>
      <Column field="sellProceeds" header="Sell Proceeds" class="min-w-36">
        <template #body="{ data }">
          <Button
            v-tooltip.top="'Cash received into your broker account from closing positions this month (sell price × qty). Accumulates in the Broker Cash Balance.'"
            variant="link"
            :label="formatCurrency(data.sellProceeds)"
            class="!p-0 underline decoration-dotted decoration-blue-400"
            @click="$emit('open-drilldown', 'sells', data)"
          />
        </template>
      </Column>
      <Column field="brokerBalance" header="Broker Cash Balance" class="min-w-36">
        <template #body="{ data }">
          <Button
            v-tooltip.top="'Running cash balance in your broker account at end of this month. New purchases draw from this first so they don\'t count as fresh salary. Click to see the full month-by-month history.'"
            variant="link"
            :label="formatCurrency(data.brokerBalance)"
            :class="[
              '!p-0 underline decoration-dotted',
              data.brokerBalance > 0
                ? '!text-amber-600 dark:!text-amber-400 decoration-amber-400'
                : '!text-inherit decoration-gray-400'
            ]"
            @click="$emit('open-drilldown', 'balance', data)"
          />
        </template>
      </Column>
      <Column field="investedEquityPercentage" header="Equity %" class="min-w-24">
        <template #body="{ data }">{{ formatPercentage(data.investedEquityPercentage) }}</template>
      </Column>
      <Column field="debtPercentage" header="Debt %" class="min-w-24">
        <template #body="{ data }">{{ formatPercentage(data.debtPercentage) }}</template>
      </Column>
      <Column field="commoditiesPercentage" header="Commodity %" class="min-w-28">
        <template #body="{ data }">{{ formatPercentage(data.commoditiesPercentage) }}</template>
      </Column>
      <Column field="total" header="Total" class="min-w-28 font-semibold">
        <template #body="{ data }">
          <Button
            variant="text"
            severity="info"
            :label="formatCurrency(data.total)"
            class="!p-0 underline decoration-dotted decoration-blue-400 font-semibold"
            @click="$emit('open-drilldown', 'total', data)"
          />
        </template>
      </Column>
      <Column field="stockProfitBooked" header="Profit Booked" class="min-w-32">
        <template #body="{ data }">
          <span
            :class="
              data.stockProfitBooked >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-500 dark:text-red-400'
            "
          >
            {{ formatCurrency(data.stockProfitBooked) }}
          </span>
        </template>
      </Column>
      <Column frozen align-frozen="right" class="w-20">
        <template #body="{ data }">
          <div class="flex gap-0.5 justify-center">
            <template v-if="isTrackingEditing(data.month)">
              <Button
                icon="pi pi-check"
                aria-label="Save"
                text
                rounded
                size="small"
                severity="success"
                @click="saveTracking(data)"
              />
              <Button
                icon="pi pi-times"
                aria-label="Cancel"
                text
                rounded
                size="small"
                severity="secondary"
                @click="cancelTrackingEdit()"
              />
            </template>
            <Button
              v-else
              icon="pi pi-pencil"
              aria-label="Edit"
              text
              rounded
              size="small"
              @click="startTrackingEdit(data)"
            />
          </div>
        </template>
      </Column>
      <ColumnGroup type="footer">
        <Row>
          <Column footer="Total" frozen />
          <Column footer="" />
          <Column :footer="formatCurrency(trackingTotals.stockEquityEtfs)" />
          <Column :footer="formatCurrency(trackingTotals.mfEquity)" />
          <Column :footer="formatCurrency(trackingTotals.ppf)" />
          <Column :footer="formatCurrency(trackingTotals.commoditiesGold)" />
          <Column :footer="formatCurrency(trackingTotals.commoditiesSilver)" />
          <Column :footer="formatCurrency(trackingTotals.commodities)" />
          <Column :footer="formatCurrency(trackingTotals.sellProceeds)" />
          <Column footer="" />
          <Column footer="" />
          <Column footer="" />
          <Column footer="" />
          <Column :footer="formatCurrency(trackingTotals.total)" />
          <Column :footer="formatCurrency(trackingTotals.stockProfitBooked)" />
          <Column footer="" frozen align-frozen="right" />
        </Row>
      </ColumnGroup>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { useDataStore } from '~/stores/data'
import { formatCurrency, formatPercentage } from '~/composables/useCalculations'
import type { TrackingRow, BudgetMonthly, BudgetYear } from '~/types'

interface StockEtfsBreakdown { openPositions: number; closedPositions: number; etfs: number }

const props = withDefaults(defineProps<{
  trackingRows: TrackingRow[]
  trackingTotals: Partial<TrackingRow>
  selectedYear: number
  budgetYear: BudgetYear
}>(), {})

defineEmits(['open-drilldown'])

const store = useDataStore()
const editingTrackingRows = ref<TrackingRow[]>([])

function isTrackingEditing(month: number) {
  return editingTrackingRows.value.some((r) => r.month === month)
}

function startTrackingEdit(row: TrackingRow) {
  editingTrackingRows.value = [{ ...row }]
}

function cancelTrackingEdit() {
  editingTrackingRows.value = []
}

function stockEtfsTooltip(b: StockEtfsBreakdown) {
  return [
    `Stocks (Open): ${formatCurrency(b.openPositions)}`,
    `Stocks (Closed): ${formatCurrency(b.closedPositions)}`,
    `ETFs: ${formatCurrency(b.etfs)}`,
  ].join('<br>')
}

function saveTracking(data: TrackingRow) {
  const year = props.selectedYear
  const month = data.month
  const mfEquity = data.mfEquityOverride != null ? Number(data.mfEquityOverride) : null
  const ppf = data.ppfOverride != null ? Number(data.ppfOverride) : null
  const totalMonthly =
    data.monthlyBudget != null && data.monthlyBudget > 0
      ? Number(data.monthlyBudget)
      : null

  const payload: Partial<BudgetMonthly> = {}
  if (mfEquity !== null) payload.mfEquity = mfEquity
  if (ppf !== null) payload.ppf = ppf
  if (totalMonthly !== null) payload.totalMonthly = totalMonthly

  const existing = store.tables.budgetMonthly.find(
    (r) => r.year === year && r.month === month,
  )
  if (existing) {
    const updated = { ...existing }
    if (mfEquity !== null) updated.mfEquity = mfEquity
    else delete updated.mfEquity
    if (ppf !== null) updated.ppf = ppf
    else delete updated.ppf
    if (totalMonthly !== null) updated.totalMonthly = totalMonthly
    else delete updated.totalMonthly
    store.updateRow('budgetMonthly', existing.id, updated)
  } else if (Object.keys(payload).length > 0) {
    store.addRow('budgetMonthly', { id: uuidv4(), year, month, ...payload })
  }
  editingTrackingRows.value = []
}
</script>
