<template>
  <div class="pb-8">
    <h2 class="text-base font-semibold text-gray-700 dark:text-gray-200 mb-2">
      Gap Analysis (Actual − Budget)
    </h2>
    <DataTable
      :value="gapRows"
      show-gridlines
      striped-rows
      scrollable
      size="small"
      class="text-sm"
    >
      <Column field="monthLabel" header="Month" frozen class="min-w-24 font-medium" />
      <Column field="extraEquity" header="Extra Equity" class="min-w-32">
        <template #body="{ data }">
          <button
            class="underline decoration-dotted cursor-pointer bg-transparent border-0 p-0 font-inherit font-medium text-left"
            :class="
              data.extraEquity >= 0
                ? 'text-green-600 dark:text-green-400 decoration-green-400'
                : 'text-red-500 dark:text-red-400 decoration-red-400'
            "
            @click="$emit('open-gap-drilldown', 'gap-extra-equity', data)"
          >
            {{ formatCurrency(data.extraEquity) }}
          </button>
        </template>
      </Column>
      <Column field="extraDebt" header="Extra Debt" class="min-w-28">
        <template #body="{ data }">
          <button
            class="underline decoration-dotted cursor-pointer bg-transparent border-0 p-0 font-inherit font-medium text-left"
            :class="
              data.extraDebt >= 0
                ? 'text-green-600 dark:text-green-400 decoration-green-400'
                : 'text-red-500 dark:text-red-400 decoration-red-400'
            "
            @click="$emit('open-gap-drilldown', 'gap-extra-debt', data)"
          >
            {{ formatCurrency(data.extraDebt) }}
          </button>
        </template>
      </Column>
      <Column field="extraCommodities" header="Extra Comm." class="min-w-32">
        <template #body="{ data }">
          <button
            class="underline decoration-dotted cursor-pointer bg-transparent border-0 p-0 font-inherit font-medium text-left"
            :class="
              data.extraCommodities >= 0
                ? 'text-green-600 dark:text-green-400 decoration-green-400'
                : 'text-red-500 dark:text-red-400 decoration-red-400'
            "
            @click="$emit('open-gap-drilldown', 'gap-extra-comm', data)"
          >
            {{ formatCurrency(data.extraCommodities) }}
          </button>
        </template>
      </Column>
      <ColumnGroup type="footer">
        <Row>
          <Column footer="Total" frozen />
          <Column>
            <template #footer>
              <span
                :class="
                  gapTotals.extraEquity >= 0
                    ? 'text-green-600 dark:text-green-400 font-medium'
                    : 'text-red-500 dark:text-red-400 font-medium'
                "
              >
                {{ formatCurrency(gapTotals.extraEquity) }}
              </span>
            </template>
          </Column>
          <Column>
            <template #footer>
              <span
                :class="
                  gapTotals.extraDebt >= 0
                    ? 'text-green-600 dark:text-green-400 font-medium'
                    : 'text-red-500 dark:text-red-400 font-medium'
                "
              >
                {{ formatCurrency(gapTotals.extraDebt) }}
              </span>
            </template>
          </Column>
          <Column>
            <template #footer>
              <span
                :class="
                  gapTotals.extraCommodities >= 0
                    ? 'text-green-600 dark:text-green-400 font-medium'
                    : 'text-red-500 dark:text-red-400 font-medium'
                "
              >
                {{ formatCurrency(gapTotals.extraCommodities) }}
              </span>
            </template>
          </Column>
        </Row>
      </ColumnGroup>
    </DataTable>
  </div>
</template>

<script setup>
import { formatCurrency } from '~/composables/useCalculations'

defineProps({
  gapRows: { type: Array, required: true },
  gapTotals: { type: Object, required: true },
})

defineEmits(['open-gap-drilldown'])
</script>
