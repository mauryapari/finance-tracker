<template>
  <template v-if="openComm.length">
    <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
      Open Positions
    </p>
    <table data-testid="commodity-purchases-open-table" class="w-full text-sm mb-4">
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
          v-for="r in openComm"
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
            {{ formatCurrency(-openComm.reduce((s, r) => s + r.buyPrice * r.qty, 0)) }}
          </td>
        </tr>
      </tfoot>
    </table>
  </template>

  <template v-if="closedComm.length">
    <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
      Closed Positions (buy leg)
    </p>
    <table data-testid="commodity-purchases-closed-table" class="w-full text-sm mb-4">
      <thead>
        <tr class="text-xs text-gray-400 border-b dark:border-gray-600">
          <th class="text-left py-1 pr-2">Type</th>
          <th class="text-left py-1 pr-2">Stock</th>
          <th class="text-left py-1 pr-2">Buy Date</th>
          <th class="text-right py-1 pr-2">Qty</th>
          <th class="text-right py-1 pr-2">Buy Rate</th>
          <th class="text-right py-1">Value</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="r in closedComm"
          :key="r.id"
          class="border-b border-gray-50 dark:border-gray-700"
        >
          <td class="py-1 pr-2 text-gray-500">{{ r.type }}</td>
          <td class="py-1 pr-2 font-mono font-semibold text-indigo-600 dark:text-indigo-400">{{ r.stock }}</td>
          <td class="py-1 pr-2 text-gray-500">{{ r.buyDate }}</td>
          <td class="py-1 pr-2 text-right">{{ r.qty }}</td>
          <td class="py-1 pr-2 text-right">{{ formatCurrency(r.buyRate) }}</td>
          <td class="py-1 text-right text-red-600 dark:text-red-400">{{ formatCurrency(-(r.buyRate * r.qty)) }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="font-semibold text-sm">
          <td colspan="5" class="pt-1 text-gray-500">Subtotal</td>
          <td class="pt-1 text-right text-red-600 dark:text-red-400">
            {{ formatCurrency(-closedComm.reduce((s, r) => s + r.buyRate * r.qty, 0)) }}
          </td>
        </tr>
      </tfoot>
    </table>
  </template>

  <p
    v-if="!openComm.length && !closedComm.length"
    data-testid="commodity-purchases-empty"
    class="text-gray-400 text-sm mb-3"
  >
    No commodity ETF purchases this month.
  </p>
</template>

<script setup>
import { computed } from 'vue'
import { formatCurrency } from '~/composables/useCalculations'
import { useDataStore } from '~/stores/data'

const props = defineProps({
  prefix: { type: String, default: null },
})

const store = useDataStore()

const openComm = computed(() => props.prefix ? store.tables.commodityEtfs.filter((r) => r.buyDate?.startsWith(props.prefix)) : [])
const closedComm = computed(() => props.prefix ? store.tables.closedCommodityEtfs.filter((r) => r.buyDate?.startsWith(props.prefix)) : [])
</script>
