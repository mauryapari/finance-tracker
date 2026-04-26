<template>
  <div class="flex flex-col flex-1 min-h-0 px-4 overflow-y-auto">
    <div class="flex items-center justify-between gap-3 py-3 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-gray-100 dark:bg-gray-900 z-10">
      <h3 class="font-semibold text-gray-700 dark:text-gray-200 text-base">CAGR</h3>
      <Select
        v-model="selectedYear"
        :options="availableYears"
        placeholder="All years"
        show-clear
        class="w-32 text-sm"
      />
    </div>
    <DataTable
      :value="filteredEntries"
      data-key="id"
      show-gridlines
      removable-sort
      size="large"
      class="text-sm"
    >
      <Column sortable field="date" header="Date"  />
      <Column sortable field="amount" header="Amount" >
        <template #body="{ data }">
          <span :class="data.investmentOrOut === 'Out'
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-500 dark:text-red-400'">
            {{data.investmentOrOut === 'Investment' ? '-' : ''}}{{ data.amount?.toLocaleString("en-IN", { maximumFractionDigits: 2 }) }}
          </span>
        </template>
      </Column>
      <Column sortable field="investmentOrOut" header="Type"/>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDerivedCagrEntries } from '~/composables/useDerivedCagrEntries'

const { derivedStockCagrEntries } = useDerivedCagrEntries()

const selectedYear = ref(null)

const availableYears = computed(() => {
  const years = new Set(derivedStockCagrEntries.value.map((r) => r.date.slice(0, 4)))
  return [...years].sort((a, b) => b - a)
})

const filteredEntries = computed(() =>
  selectedYear.value
    ? derivedStockCagrEntries.value.filter((r) => r.date.startsWith(selectedYear.value))
    : derivedStockCagrEntries.value,
)
</script>
