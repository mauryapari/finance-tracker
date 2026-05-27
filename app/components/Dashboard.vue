<template>
  <div class="p-4 space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-10 gap-4 items-start">
      <div class="md:col-span-4">
        <SummaryCard
          title="Stock Portfolio"
          :summary="stockSummary"
          :cagr="stockCagr"
          :positions="[...store.tables.openPositions, ...store.tables.etfs]"
        />
      </div>
      <div class="md:col-span-4">
        <SummaryCard
          title="Commodity Portfolio"
          :summary="commoditySummary"
          :cagr="commodityCagr"
          :positions="store.tables.commodityEtfs"
        />
      </div>
      <div class="md:col-span-2">
        <InvestmentCalculator />
      </div>
    </div>

    <!-- Watchlist summary widget — shown only when watchlist has entries -->
    <WatchlistWidget v-if="store.tables.watchlist.length" />

    <TradeHistory />
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
