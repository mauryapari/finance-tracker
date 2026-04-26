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
      <Column field="stockEquityEtfs" header="Stock+ETFs" class="min-w-32">
        <template #body="{ data }">
          <button
            v-tooltip.top="{
              value: stockEtfsTooltip(data.stockEquityEtfsBreakdown),
              escape: false,
              showDelay: 300,
            }"
            class="underline decoration-dotted decoration-blue-400 text-blue-600 dark:text-blue-400 cursor-pointer bg-transparent border-0 p-0 font-inherit text-left"
            @click="$emit('open-drilldown', 'stocks', data)"
          >
            {{ formatCurrency(data.stockEquityEtfs) }}
          </button>
        </template>
      </Column>
      <Column field="mfEquity" header="MF Equity" class="min-w-32">
        <template #body="{ data }">{{ formatCurrency(data.mfEquity) }}</template>
        <template #editor="{ data, field }">
          <InputNumber
            v-model="data[field]"
            :min-fraction-digits="2"
            size="small"
            class="w-full"
          />
        </template>
      </Column>
      <Column field="ppf" header="PPF" class="min-w-28">
        <template #body="{ data }">{{ formatCurrency(data.ppf) }}</template>
        <template #editor="{ data, field }">
          <InputNumber
            v-model="data[field]"
            :min-fraction-digits="2"
            size="small"
            class="w-full"
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
          <button
            v-tooltip.top="'Cash received into your broker account from closing positions this month (sell price × qty). Accumulates in the Broker Cash Balance.'"
            class="underline decoration-dotted decoration-blue-400 text-blue-600 dark:text-blue-400 cursor-pointer bg-transparent border-0 p-0 font-inherit text-left"
            @click="$emit('open-drilldown', 'sells', data)"
          >
            {{ formatCurrency(data.sellProceeds) }}
          </button>
        </template>
      </Column>
      <Column field="brokerBalance" header="Broker Cash Balance" class="min-w-36">
        <template #body="{ data }">
          <button
            v-tooltip.top="'Running cash balance in your broker account at end of this month. New purchases draw from this first so they don\'t count as fresh salary. Click to see the full month-by-month history.'"
            class="cursor-pointer bg-transparent border-0 p-0 font-inherit text-left underline decoration-dotted"
            :class="
              data.brokerBalance > 0
                ? 'text-amber-600 dark:text-amber-400 decoration-amber-400'
                : 'decoration-gray-400'
            "
            @click="$emit('open-drilldown', 'balance', data)"
          >
            {{ formatCurrency(data.brokerBalance) }}
          </button>
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
          <button
            class="underline decoration-dotted decoration-blue-400 text-blue-600 dark:text-blue-400 cursor-pointer bg-transparent border-0 p-0 font-inherit font-semibold text-left"
            @click="$emit('open-drilldown', 'total', data)"
          >
            {{ formatCurrency(data.total) }}
          </button>
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
                @click="cancelTrackingEdit(data)"
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

<script setup>
import { ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { useDataStore } from '~/stores/data'
import { formatCurrency, formatPercentage } from '~/composables/useCalculations'

const props = defineProps({
  trackingRows: { type: Array, required: true },
  trackingTotals: { type: Object, required: true },
  selectedYear: { type: Number, required: true },
})

defineEmits(['open-drilldown'])

const store = useDataStore()
const editingTrackingRows = ref([])

function isTrackingEditing(month) {
  return editingTrackingRows.value.some((r) => r.month === month)
}

function startTrackingEdit(row) {
  editingTrackingRows.value = [{ ...row }]
}

function cancelTrackingEdit() {
  editingTrackingRows.value = []
}

function stockEtfsTooltip(b) {
  return [
    `Stocks (Open): ${formatCurrency(b.openPositions)}`,
    `Stocks (Closed): ${formatCurrency(b.closedPositions)}`,
    `ETFs: ${formatCurrency(b.etfs)}`,
  ].join('<br>')
}

function saveTracking(data) {
  const year = props.selectedYear
  const month = data.month
  const mfEquity = Number(data.mfEquity) || 0
  const ppf = Number(data.ppf) || 0

  const existing = store.tables.budgetMonthly.find(
    (r) => r.year === year && r.month === month,
  )
  if (existing) {
    store.updateRow('budgetMonthly', existing.id, { ...existing, mfEquity, ppf })
  } else {
    store.addRow('budgetMonthly', { id: uuidv4(), year, month, mfEquity, ppf })
  }
  editingTrackingRows.value = []
}
</script>
