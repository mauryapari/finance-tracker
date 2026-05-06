<template>
  <template v-if="openPos.length">
    <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
      Open Positions
    </p>
    <table data-testid="stock-purchases-open-table" class="w-full text-sm mb-4">
      <thead>
        <tr class="text-xs text-gray-400 border-b dark:border-gray-600">
          <th class="text-left py-1 pr-2">Stock</th>
          <th class="text-left py-1 pr-2">Buy Date</th>
          <th class="text-right py-1 pr-2">Qty</th>
          <th class="text-right py-1 pr-2">Price</th>
          <th class="text-right py-1">Value</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="r in openPos"
          :key="r.id"
          class="border-b border-gray-50 dark:border-gray-700"
        >
          <td class="py-1 pr-2 font-mono font-semibold text-indigo-600 dark:text-indigo-400">{{ r.stock }}</td>
          <td class="py-1 pr-2 text-gray-500">{{ r.buyDate }}</td>
          <td class="py-1 pr-2 text-right">{{ r.qty }}</td>
          <td class="py-1 pr-2 text-right">{{ formatCurrency(r.buyPrice) }}</td>
          <td class="py-1 text-right text-red-600 dark:text-red-400">{{ formatCurrency(-(r.buyPrice * r.qty)) }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="font-semibold text-sm">
          <td colspan="4" class="pt-1 text-gray-500">Subtotal</td>
          <td class="pt-1 text-right text-red-600 dark:text-red-400">
            {{ formatCurrency(-openPos.reduce((s, r) => s + r.buyPrice * r.qty, 0)) }}
          </td>
        </tr>
      </tfoot>
    </table>
  </template>

  <template v-if="closedPos.length">
    <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
      Closed Positions (buy leg)
    </p>
    <table data-testid="stock-purchases-closed-table" class="w-full text-sm mb-4">
      <thead>
        <tr class="text-xs text-gray-400 border-b dark:border-gray-600">
          <th class="text-left py-1 pr-2">Stock</th>
          <th class="text-left py-1 pr-2">Buy Date</th>
          <th class="text-right py-1 pr-2">Qty</th>
          <th class="text-right py-1 pr-2">Buy Rate</th>
          <th class="text-right py-1">Value</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="r in closedPos"
          :key="r.id"
          class="border-b border-gray-50 dark:border-gray-700"
        >
          <td class="py-1 pr-2 font-mono font-semibold text-indigo-600 dark:text-indigo-400">{{ r.stock }}</td>
          <td class="py-1 pr-2 text-gray-500">{{ r.buyDate }}</td>
          <td class="py-1 pr-2 text-right">{{ r.qty }}</td>
          <td class="py-1 pr-2 text-right">{{ formatCurrency(r.buyRate) }}</td>
          <td class="py-1 text-right text-red-600 dark:text-red-400">{{ formatCurrency(-(r.buyRate * r.qty)) }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="font-semibold text-sm">
          <td colspan="4" class="pt-1 text-gray-500">Subtotal</td>
          <td class="pt-1 text-right text-red-600 dark:text-red-400">
            {{ formatCurrency(-closedPos.reduce((s, r) => s + r.buyRate * r.qty, 0)) }}
          </td>
        </tr>
      </tfoot>
    </table>
  </template>

  <template v-if="etfRows.length">
    <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
      ETFs
    </p>
    <table data-testid="stock-purchases-etf-table" class="w-full text-sm mb-4">
      <thead>
        <tr class="text-xs text-gray-400 border-b dark:border-gray-600">
          <th class="text-left py-1 pr-2">Type</th>
          <th class="text-left py-1 pr-2">Stock</th>
          <th class="text-left py-1 pr-2">Buy Date</th>
          <th class="text-right py-1 pr-2">Qty</th>
          <th class="text-right py-1 pr-2">Price</th>
          <th class="text-right py-1">Value</th>
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
          <td class="py-1 pr-2 text-gray-500">{{ r.buyDate }}</td>
          <td class="py-1 pr-2 text-right">{{ r.qty }}</td>
          <td class="py-1 pr-2 text-right">{{ formatCurrency(r.buyPrice) }}</td>
          <td class="py-1 text-right text-red-600 dark:text-red-400">{{ formatCurrency(-(r.buyPrice * r.qty)) }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="font-semibold text-sm">
          <td colspan="5" class="pt-1 text-gray-500">Subtotal</td>
          <td class="pt-1 text-right text-red-600 dark:text-red-400">
            {{ formatCurrency(-etfRows.reduce((s, r) => s + r.buyPrice * r.qty, 0)) }}
          </td>
        </tr>
      </tfoot>
    </table>
  </template>

  <p
    v-if="!openPos.length && !closedPos.length && !etfRows.length"
    data-testid="stock-purchases-empty"
    class="text-gray-400 text-sm"
  >
    No stock or ETF purchases this month.
  </p>

  <div
    v-if="showTotal"
    data-testid="stock-purchases-total"
    class="border-t dark:border-gray-600 pt-2 mt-2 flex justify-between font-bold text-base"
  >
    <span>{{ totalLabel }}</span>
    <span class="text-red-600 dark:text-red-400">{{ formatCurrency(-totalCashOut) }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '~/composables/useCalculations'
import { useDataStore } from '~/stores/data'

const props = defineProps({
  prefix: { type: String, default: null },
  showTotal: { type: Boolean, default: true },
  totalLabel: { type: String, default: 'Net Cash Out' },
})

const store = useDataStore()

const openPos = computed(() => props.prefix ? store.tables.openPositions.filter((r) => r.buyDate?.startsWith(props.prefix)) : [])
const closedPos = computed(() => props.prefix ? store.tables.closedPositions.filter((r) => r.buyDate?.startsWith(props.prefix)) : [])
const etfRows = computed(() => props.prefix ? store.tables.etfs.filter((r) => r.buyDate?.startsWith(props.prefix)) : [])

const totalCashOut = computed(() =>
  openPos.value.reduce((s, r) => s + r.buyPrice * r.qty, 0) +
  closedPos.value.reduce((s, r) => s + r.buyRate * r.qty, 0) +
  etfRows.value.reduce((s, r) => s + r.buyPrice * r.qty, 0),
)
</script>
