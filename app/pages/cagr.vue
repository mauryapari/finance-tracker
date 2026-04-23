<template>
  <div class="flex flex-col h-full px-4">
    <div class="flex items-center py-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
      <h3 class="font-semibold text-gray-700 dark:text-gray-200 text-base">CAGR</h3>
    </div>
    <DataTable
      :value="derivedStockCagrEntries"
      dataKey="id"
      showGridlines
      scrollable
      scrollHeight="flex"
      removableSort
      size="large"
      class="text-sm flex-1"
    >
      <Column sortable field="date" header="Date" style="min-width:8rem" />
      <Column sortable field="amount" header="Amount" style="min-width:10rem">
        <template #body="{ data }">
          {{ data.amount?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) }}
        </template>
      </Column>
      <Column sortable field="investmentOrOut" header="Type" style="min-width:8rem" />
    </DataTable>
  </div>
</template>

<script setup>
import { useDerivedCagrEntries } from '~/composables/useDerivedCagrEntries'
const { derivedStockCagrEntries } = useDerivedCagrEntries()
</script>
