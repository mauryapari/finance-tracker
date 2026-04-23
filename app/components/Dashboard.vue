<template>
  <div class="p-4 space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SummaryCard title="Stock Portfolio" :summary="stockSummary" :cagr="stockCagr" />
      <SummaryCard title="Commodity Portfolio" :summary="commoditySummary" :cagr="commodityCagr" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDataStore } from '~/stores/data'
import { calcPortfolioSummary } from '~/composables/useCalculations'
import { useDerivedCagrEntries } from '~/composables/useDerivedCagrEntries'

const store = useDataStore()
const { derivedStockCagrEntries, derivedCommodityCagrEntries } = useDerivedCagrEntries()

const stockSummary = computed(() => calcPortfolioSummary(
  store.tables.openPositions,
  derivedStockCagrEntries.value
))
const commoditySummary = computed(() => calcPortfolioSummary(
  store.tables.commodityEtfs,
  derivedCommodityCagrEntries.value
))

const stockCagr = computed(() => stockSummary.value.cagr)
const commodityCagr = computed(() => commoditySummary.value.cagr)
</script>
