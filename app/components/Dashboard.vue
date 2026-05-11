<template>
  <div class="p-4 space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SummaryCard
        title="Stock Portfolio"
        :summary="stockSummary"
        :cagr="stockCagr"
        :positions="[...store.tables.openPositions, ...store.tables.etfs]"
      />
      <SummaryCard
        title="Commodity Portfolio"
        :summary="commoditySummary"
        :cagr="commodityCagr"
        :positions="store.tables.commodityEtfs"
      />
    </div>
    <InvestmentCalculator />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useDataStore } from "~/stores/data";
import { calcPortfolioSummary } from "~/composables/useCalculations";
import { useDerivedCagrEntries } from "~/composables/useDerivedCagrEntries";

const store = useDataStore();
const { derivedStockCagrEntries, derivedCommodityCagrEntries } =
  useDerivedCagrEntries();

const stockSummary = computed(() =>
  calcPortfolioSummary(
    [...store.tables.openPositions, ...store.tables.etfs],
    derivedStockCagrEntries.value,
  ),
);
const commoditySummary = computed(() =>
  calcPortfolioSummary(
    store.tables.commodityEtfs,
    derivedCommodityCagrEntries.value,
  ),
);

const stockCagr = computed(() => stockSummary.value.cagr);
const commodityCagr = computed(() => commoditySummary.value.cagr);
</script>
