<template>
  <template v-if="stocks.length">
    <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
      Stocks
    </p>
    <table data-testid="sell-proceeds-stocks-table" class="w-full text-sm mb-4">
      <thead>
        <tr class="text-xs text-gray-400 border-b dark:border-gray-600">
          <th class="text-left py-1 pr-2">Stock</th>
          <th class="text-left py-1 pr-2">Sell Date</th>
          <th class="text-right py-1 pr-2">Qty</th>
          <th class="text-right py-1 pr-2">Sell Price</th>
          <th class="text-right py-1">Proceeds</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="r in stocks"
          :key="r.id"
          class="border-b border-gray-50 dark:border-gray-700"
        >
          <td class="py-1 pr-2 font-mono font-semibold text-indigo-600 dark:text-indigo-400">{{ r.stock }}</td>
          <td class="py-1 pr-2 text-gray-500">{{ r.sellDate }}</td>
          <td class="py-1 pr-2 text-right">{{ r.qty }}</td>
          <td class="py-1 pr-2 text-right">{{ formatCurrency(r.sellPrice) }}</td>
          <td class="py-1 text-right text-green-600 dark:text-green-400">{{ formatCurrency(r.sellPrice * r.qty) }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="font-semibold text-sm">
          <td colspan="4" class="pt-1 text-gray-500">Subtotal</td>
          <td class="pt-1 text-right text-green-600 dark:text-green-400">
            {{ formatCurrency(stocks.reduce((s, r) => s + r.sellPrice * r.qty, 0)) }}
          </td>
        </tr>
      </tfoot>
    </table>
  </template>

  <template v-if="etfRows.length">
    <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
      ETFs
    </p>
    <table data-testid="sell-proceeds-etf-table" class="w-full text-sm mb-4">
      <thead>
        <tr class="text-xs text-gray-400 border-b dark:border-gray-600">
          <th class="text-left py-1 pr-2">Type</th>
          <th class="text-left py-1 pr-2">Stock</th>
          <th class="text-left py-1 pr-2">Sell Date</th>
          <th class="text-right py-1 pr-2">Qty</th>
          <th class="text-right py-1 pr-2">Sell Price</th>
          <th class="text-right py-1">Proceeds</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="r in etfRows"
          :key="r.id"
          class="border-b border-gray-50 dark:border-gray-700"
        >
          <td class="py-1 pr-2 text-gray-500">{{ r.type }}</td>
          <td class="py-1 pr-2 font-mono font-semibold text-indigo-600 dark:text-indigo-400">{{ r.stock }}</td>
          <td class="py-1 pr-2 text-gray-500">{{ r.sellDate }}</td>
          <td class="py-1 pr-2 text-right">{{ r.qty }}</td>
          <td class="py-1 pr-2 text-right">{{ formatCurrency(r.sellPrice) }}</td>
          <td class="py-1 text-right text-green-600 dark:text-green-400">{{ formatCurrency(r.sellPrice * r.qty) }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="font-semibold text-sm">
          <td colspan="5" class="pt-1 text-gray-500">Subtotal</td>
          <td class="pt-1 text-right text-green-600 dark:text-green-400">
            {{ formatCurrency(etfRows.reduce((s, r) => s + r.sellPrice * r.qty, 0)) }}
          </td>
        </tr>
      </tfoot>
    </table>
  </template>

  <template v-if="commodities.length">
    <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
      Commodity ETFs
    </p>
    <table data-testid="sell-proceeds-commodities-table" class="w-full text-sm mb-4">
      <thead>
        <tr class="text-xs text-gray-400 border-b dark:border-gray-600">
          <th class="text-left py-1 pr-2">Stock</th>
          <th class="text-left py-1 pr-2">Sell Date</th>
          <th class="text-right py-1 pr-2">Qty</th>
          <th class="text-right py-1 pr-2">Sell Price</th>
          <th class="text-right py-1">Proceeds</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="r in commodities"
          :key="r.id"
          class="border-b border-gray-50 dark:border-gray-700"
        >
          <td class="py-1 pr-2 font-mono font-semibold text-indigo-600 dark:text-indigo-400">{{ r.stock }}</td>
          <td class="py-1 pr-2 text-gray-500">{{ r.sellDate }}</td>
          <td class="py-1 pr-2 text-right">{{ r.qty }}</td>
          <td class="py-1 pr-2 text-right">{{ formatCurrency(r.sellPrice) }}</td>
          <td class="py-1 text-right text-green-600 dark:text-green-400">{{ formatCurrency(r.sellPrice * r.qty) }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="font-semibold text-sm">
          <td colspan="4" class="pt-1 text-gray-500">Subtotal</td>
          <td class="pt-1 text-right text-green-600 dark:text-green-400">
            {{ formatCurrency(commodities.reduce((s, r) => s + r.sellPrice * r.qty, 0)) }}
          </td>
        </tr>
      </tfoot>
    </table>
  </template>

  <p
    v-if="!stocks.length && !etfRows.length && !commodities.length"
    data-testid="sell-proceeds-empty"
    class="text-gray-400 text-sm"
  >
    No positions closed this month.
  </p>

  <div
    data-testid="sell-proceeds-total"
    class="border-t dark:border-gray-600 pt-2 mt-2 flex justify-between font-bold text-base"
  >
    <span>Total Inflow</span>
    <span class="text-green-600 dark:text-green-400">{{ formatCurrency(totalInflow) }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '~/composables/useCalculations'
import { useDataStore } from '~/stores/data'

const props = defineProps({
  prefix: { type: String, default: null },
})

const store = useDataStore()

const stocks = computed(() => props.prefix ? store.tables.closedPositions.filter((r) => r.sellDate?.startsWith(props.prefix)) : [])
const etfRows = computed(() => props.prefix ? store.tables.closedEtfs.filter((r) => r.sellDate?.startsWith(props.prefix)) : [])
const commodities = computed(() => props.prefix ? store.tables.closedCommodityEtfs.filter((r) => r.sellDate?.startsWith(props.prefix)) : [])

const totalInflow = computed(() =>
  stocks.value.reduce((s, r) => s + r.sellPrice * r.qty, 0) +
  etfRows.value.reduce((s, r) => s + r.sellPrice * r.qty, 0) +
  commodities.value.reduce((s, r) => s + r.sellPrice * r.qty, 0),
)
</script>
