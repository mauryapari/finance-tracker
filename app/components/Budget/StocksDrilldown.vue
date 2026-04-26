<template>
  <Dialog
    :visible="visible"
    modal
    :header="`Stock + ETF Investments — ${monthLabel}`"
    :style="{ width: '44rem' }"
    :content-style="{ maxHeight: '72vh', overflowY: 'auto' }"
    @update:visible="(v) => { if (!v) $emit('close') }"
  >
    <template v-if="stocksDrilldownData">
      <template v-if="stocksDrilldownData.openPos.length">
        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
          Open Positions
        </p>
        <table class="w-full text-sm mb-4">
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
              v-for="r in stocksDrilldownData.openPos"
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
                {{ formatCurrency(-stocksDrilldownData.openPos.reduce((s, r) => s + r.buyPrice * r.qty, 0)) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </template>

      <template v-if="stocksDrilldownData.closedPos.length">
        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
          Closed Positions (buy leg)
        </p>
        <table class="w-full text-sm mb-4">
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
              v-for="r in stocksDrilldownData.closedPos"
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
                {{ formatCurrency(-stocksDrilldownData.closedPos.reduce((s, r) => s + r.buyRate * r.qty, 0)) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </template>

      <template v-if="stocksDrilldownData.etfRows.length">
        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
          ETFs
        </p>
        <table class="w-full text-sm mb-4">
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
              v-for="r in stocksDrilldownData.etfRows"
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
                {{ formatCurrency(-stocksDrilldownData.etfRows.reduce((s, r) => s + r.buyPrice * r.qty, 0)) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </template>

      <p
        v-if="!stocksDrilldownData.openPos.length && !stocksDrilldownData.closedPos.length && !stocksDrilldownData.etfRows.length"
        class="text-gray-400 text-sm"
      >
        No stock or ETF purchases this month.
      </p>

      <div class="border-t dark:border-gray-600 pt-2 mt-2 flex justify-between font-bold text-base">
        <span>Net Cash Out</span>
        <span class="text-red-600 dark:text-red-400">{{
          formatCurrency(-(
            stocksDrilldownData.openPos.reduce((s, r) => s + r.buyPrice * r.qty, 0) +
            stocksDrilldownData.closedPos.reduce((s, r) => s + r.buyRate * r.qty, 0) +
            stocksDrilldownData.etfRows.reduce((s, r) => s + r.buyPrice * r.qty, 0)
          ))
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

const stocksDrilldownData = computed(() => {
  const p = prefix.value
  if (!p) return null
  return {
    openPos: store.tables.openPositions.filter((r) => r.buyDate?.startsWith(p)),
    closedPos: store.tables.closedPositions.filter((r) => r.buyDate?.startsWith(p)),
    etfRows: store.tables.etfs.filter((r) => r.buyDate?.startsWith(p)),
  }
})
</script>
