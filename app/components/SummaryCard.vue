<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-5 space-y-3">
    <h2 class="text-lg font-semibold text-gray-700 dark:text-gray-200">
      {{ title }}
    </h2>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <p
          class="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide"
        >
          Net Value
        </p>
        <p class="text-xl font-bold text-gray-800 dark:text-gray-100">
          {{ formatCurrency(summary.netValue) }}
        </p>
      </div>
      <div>
        <p
          class="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide"
        >
          Invested
        </p>
        <p class="text-xl font-bold text-gray-800 dark:text-gray-100">
          {{ formatCurrency(summary.totalInvested) }}
        </p>
      </div>
      <div>
        <p
          class="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide"
        >
          Profit / Loss
        </p>
        <p
          :class="[
            'text-xl font-bold',
            summary.profit >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-500 dark:text-red-400',
          ]"
        >
          {{ formatCurrency(summary.profit) }}
          <span class="text-sm"
            >({{ summary.profitPercentage.toFixed(2) }}%)</span
          >
        </p>
      </div>
      <div>
        <p
          class="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide"
        >
          CAGR
        </p>
        <p
          :class="[
            'text-xl font-bold',
            cagr >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-500 dark:text-red-400',
          ]"
        >
          {{ cagr.toFixed(2) }}%
        </p>
      </div>
    </div>

    <Button
      v-if="positions.length"
      :label="showBreakdown ? '▲ Hide breakdown' : '▼ Show breakdown'"
      variant="link"
      size="small"
      class="mt-1 !p-0 text-xs"
      @click="showBreakdown = !showBreakdown"
    />

    <div v-if="showBreakdown" class="mt-2 overflow-x-auto">
      <table class="w-full text-xs text-left">
        <thead>
          <tr
            class="text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700"
          >
            <th
              class="pb-1 pr-3 font-medium cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200"
              @click="cycleNameSort"
            >
              Stock
              <span v-if="nameSort === 'asc'">▲</span>
              <span v-else-if="nameSort === 'desc'">▼</span>
            </th>
            <th class="pb-1 pr-3 font-medium text-right">Invested</th>
            <th class="pb-1 pr-3 font-medium text-right">Net Value</th>
            <th class="pb-1 font-medium text-right">Gain</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, i) in breakdownRows"
            :key="i"
            class="border-b border-gray-50 dark:border-gray-700/50 last:border-0"
          >
            <td class="py-1 pr-3 text-gray-700 dark:text-gray-300">
              {{ row.stock }}
              <span
                v-if="row.type"
                class="ml-1 text-gray-400 dark:text-gray-500"
                >({{ row.type }})</span
              >
            </td>
            <td class="py-1 pr-3 text-right text-gray-700 dark:text-gray-300">
              {{ formatCurrency(row.invested) }}
            </td>
            <td class="py-1 pr-3 text-right text-gray-700 dark:text-gray-300">
              {{ formatCurrency(row.netValue) }}
            </td>
            <td
              :class="[
                'py-1 text-right font-medium',
                row.gainPercentage >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-500 dark:text-red-400',
              ]"
            >
              {{ row.gainPercentage.toFixed(1) }}%
            </td>
          </tr>
        </tbody>
      </table>
      <p
        v-if="skippedCount"
        class="mt-1 text-xs text-gray-400 dark:text-gray-500 italic"
      >
        {{ skippedCount }} position{{ skippedCount > 1 ? "s" : "" }} excluded
        (CMP not loaded)
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import {
  calculateBuyValue,
  calculateCurrentValue,
} from "~/composables/useCalculations";

const props = defineProps({
  title: { type: String, default: "" },
  summary: {
    type: Object,
    default: () => ({
      netValue: 0,
      totalInvested: 0,
      profit: 0,
      profitPercentage: 0,
      cagr: 0,
    }),
  },
  cagr: { type: Number, default: 0 },
  positions: { type: Array, default: () => [] },
});

const showBreakdown = ref(false);
const nameSort = ref(null); // null | 'asc' | 'desc'

function cycleNameSort() {
  nameSort.value = nameSort.value === null ? 'asc' : nameSort.value === 'asc' ? 'desc' : null
}

const skippedCount = computed(
  () => props.positions.filter((p) => !p.cmp).length,
);

const breakdownRows = computed(() =>
  props.positions
    .filter((p) => p.cmp)
    .map((p) => {
      const invested = calculateBuyValue(p.buyPrice, p.qty);
      const netValue = calculateCurrentValue(p.cmp, p.qty);
      const gainPercentage =
        invested > 0 ? ((netValue - invested) / invested) * 100 : 0;
      return {
        stock: p.stock,
        type: p.type ?? null,
        invested,
        netValue,
        gainPercentage,
      };
    })
    .sort((a, b) => {
      if (nameSort.value === 'asc') return a.stock.localeCompare(b.stock)
      if (nameSort.value === 'desc') return b.stock.localeCompare(a.stock)
      return b.invested - a.invested
    }),
);

function formatCurrency(n) {
  return "₹" + (n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}
</script>
