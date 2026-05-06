<template>
  <div class="flex flex-col flex-1 min-h-0 px-4 overflow-y-auto">
    <div
      class="flex items-center justify-between gap-3 py-3 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-gray-100 dark:bg-gray-900 z-10"
    >
      <h3 class="font-semibold text-gray-700 dark:text-gray-200 text-base">
        Commodity CAGR
      </h3>
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
      <Column header="Sr.no">
        <template #body="{ index }">{{ index + 1 }}</template>
      </Column>
      <Column sortable field="date" header="Date" style="min-width: 8rem" />
      <Column sortable field="amount" header="Amount" style="min-width: 10rem">
        <template #body="{ data }">
          <span
            :class="
              data.investmentOrOut === 'Out'
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-500 dark:text-red-400'
            "
          >
            {{ data.investmentOrOut === "Out" ? "" : "-" }}
            {{
              data.amount?.toLocaleString("en-IN", { maximumFractionDigits: 2 })
            }}
          </span>
        </template>
      </Column>
      <Column
        sortable
        field="investmentOrOut"
        header="Type"
        style="min-width: 8rem"
      />
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useDerivedCagrEntries } from "~/composables/useDerivedCagrEntries";

const { derivedCommodityCagrEntries } = useDerivedCagrEntries();

const selectedYear = ref<string | null>(null);

const availableYears = computed(() => {
  const years = new Set(
    derivedCommodityCagrEntries.value.map((r) => r.date.slice(0, 4)),
  );
  return [...years].sort((a, b) => Number(b) - Number(a));
});

const filteredEntries = computed(() => {
  const year = selectedYear.value
  return year
    ? derivedCommodityCagrEntries.value.filter((r) => r.date.startsWith(year))
    : derivedCommodityCagrEntries.value
});
</script>
