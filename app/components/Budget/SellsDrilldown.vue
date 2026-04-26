<template>
  <Dialog
    :visible="visible"
    modal
    :header="`Sell Proceeds — ${monthLabel}`"
    :style="{ width: '44rem' }"
    :content-style="{ maxHeight: '72vh', overflowY: 'auto' }"
    @update:visible="(v) => { if (!v) $emit('close') }"
  >
    <template v-if="sellsDrilldownData">
      <template v-if="sellsDrilldownData.stocks.length">
        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
          Stocks
        </p>
        <table class="w-full text-sm mb-4">
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
              v-for="r in sellsDrilldownData.stocks"
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
                {{ formatCurrency(sellsDrilldownData.stocks.reduce((s, r) => s + r.sellPrice * r.qty, 0)) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </template>

      <template v-if="sellsDrilldownData.etfRows.length">
        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
          ETFs
        </p>
        <table class="w-full text-sm mb-4">
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
              v-for="r in sellsDrilldownData.etfRows"
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
                {{ formatCurrency(sellsDrilldownData.etfRows.reduce((s, r) => s + r.sellPrice * r.qty, 0)) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </template>

      <template v-if="sellsDrilldownData.commodities.length">
        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
          Commodity ETFs
        </p>
        <table class="w-full text-sm mb-4">
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
              v-for="r in sellsDrilldownData.commodities"
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
                {{ formatCurrency(sellsDrilldownData.commodities.reduce((s, r) => s + r.sellPrice * r.qty, 0)) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </template>

      <p
        v-if="!sellsDrilldownData.stocks.length && !sellsDrilldownData.etfRows.length && !sellsDrilldownData.commodities.length"
        class="text-gray-400 text-sm"
      >
        No positions closed this month.
      </p>

      <div class="border-t dark:border-gray-600 pt-2 mt-2 flex justify-between font-bold text-base">
        <span>Total Inflow</span>
        <span class="text-green-600 dark:text-green-400">{{
          formatCurrency(
            sellsDrilldownData.stocks.reduce((s, r) => s + r.sellPrice * r.qty, 0) +
            sellsDrilldownData.etfRows.reduce((s, r) => s + r.sellPrice * r.qty, 0) +
            sellsDrilldownData.commodities.reduce((s, r) => s + r.sellPrice * r.qty, 0),
          )
        }}</span>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useDataStore } from '~/stores/data'
import { formatCurrency } from '~/composables/useCalculations'

const props = defineProps({
  visible: { type: Boolean, required: true },
  year: { type: Number, default: null },
  month: { type: Number, default: null },
  monthLabel: { type: String, default: '' },
})

defineEmits(['close'])

const store = useDataStore()

const prefix = computed(() => {
  if (!props.year || !props.month) return null
  return `${props.year}-${String(props.month).padStart(2, '0')}`
})

const sellsDrilldownData = computed(() => {
  const p = prefix.value
  if (!p) return null
  return {
    stocks: store.tables.closedPositions.filter((r) => r.sellDate?.startsWith(p)),
    etfRows: store.tables.closedEtfs.filter((r) => r.sellDate?.startsWith(p)),
    commodities: store.tables.closedCommodityEtfs.filter((r) => r.sellDate?.startsWith(p)),
  }
})
</script>
