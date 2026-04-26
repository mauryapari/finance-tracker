<template>
  <Dialog
    :visible="visible"
    modal
    :header="`Broker Cash Balance History — through ${monthLabel}`"
    :style="{ width: '52rem' }"
    :content-style="{ maxHeight: '72vh', overflowY: 'auto' }"
    @update:visible="(v) => { if (!v) $emit('close') }"
  >
    <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
      Each month: sell proceeds are added to the broker cash balance, then
      purchases draw from it (used from cash balance) before counting as fresh
      salary.
    </p>
    <table class="w-full text-sm">
      <thead>
        <tr class="text-xs text-gray-400 border-b dark:border-gray-600">
          <th class="text-left py-1 pr-3">Month</th>
          <th class="text-right py-1 pr-3">Sell Proceeds</th>
          <th class="text-right py-1 pr-3">Total Purchases</th>
          <th class="text-right py-1 pr-3">Used from Cash Balance</th>
          <th class="text-right py-1">Closing Cash Balance</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in balanceHistory"
          :key="row.prefix"
          class="border-b border-gray-50 dark:border-gray-700"
          :class="row.prefix === currentPrefix ? 'bg-blue-50 dark:bg-blue-900/20 font-semibold' : ''"
        >
          <td class="py-1 pr-3 font-mono">{{ row.prefix }}</td>
          <td class="py-1 pr-3 text-right">
            <button
              v-if="row.sellProceeds > 0"
              class="underline decoration-dotted decoration-green-400 text-green-600 dark:text-green-400 cursor-pointer bg-transparent border-0 p-0 font-inherit"
              @click="historyRowDrilldown = { type: 'hr-sells', prefix: row.prefix, monthLabel: row.prefix }"
            >
              {{ formatCurrency(row.sellProceeds) }}
            </button>
            <span v-else class="text-gray-400">—</span>
          </td>
          <td class="py-1 pr-3 text-right">
            <button
              v-if="row.totalBuys > 0"
              class="underline decoration-dotted decoration-red-400 text-red-600 dark:text-red-400 cursor-pointer bg-transparent border-0 p-0 font-inherit"
              @click="historyRowDrilldown = { type: 'hr-buys', prefix: row.prefix, monthLabel: row.prefix }"
            >
              {{ formatCurrency(-row.totalBuys) }}
            </button>
            <span v-else class="text-gray-400">—</span>
          </td>
          <td class="py-1 pr-3 text-right">
            <button
              v-if="row.recycled > 0"
              class="underline decoration-dotted decoration-amber-400 text-amber-600 dark:text-amber-400 cursor-pointer bg-transparent border-0 p-0 font-inherit"
              @click="historyRowDrilldown = { type: 'hr-recycled', prefix: row.prefix, monthLabel: row.prefix }"
            >
              {{ formatCurrency(row.recycled) }}
            </button>
            <span v-else class="text-gray-400">—</span>
          </td>
          <td
            class="py-1 text-right"
            :class="row.balance > 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''"
          >
            {{ formatCurrency(row.balance) }}
          </td>
        </tr>
      </tbody>
      <tfoot v-if="balanceHistory.length">
        <tr class="font-semibold border-t dark:border-gray-500 text-sm">
          <td class="pt-1 pr-3 text-gray-500">Total</td>
          <td class="pt-1 pr-3 text-right text-green-600 dark:text-green-400">
            {{ formatCurrency(balanceHistory.reduce((s, r) => s + r.sellProceeds, 0)) }}
          </td>
          <td class="pt-1 pr-3 text-right text-red-600 dark:text-red-400">
            {{ formatCurrency(-balanceHistory.reduce((s, r) => s + r.totalBuys, 0)) }}
          </td>
          <td class="pt-1 pr-3 text-right text-amber-600 dark:text-amber-400">
            {{ formatCurrency(balanceHistory.reduce((s, r) => s + r.recycled, 0)) }}
          </td>
          <td class="pt-1 text-right" />
        </tr>
      </tfoot>
    </table>
    <p v-if="!balanceHistory.length" class="text-gray-400 text-sm mt-2">
      No broker activity found.
    </p>
  </Dialog>

  <!-- History Row: Sell Proceeds Sub-dialog -->
  <Dialog
    :visible="historyRowDrilldown?.type === 'hr-sells'"
    modal
    :header="`Sell Proceeds — ${historyRowDrilldown?.monthLabel ?? ''}`"
    :style="{ width: '44rem' }"
    :content-style="{ maxHeight: '72vh', overflowY: 'auto' }"
    @update:visible="(v) => { if (!v) historyRowDrilldown = null }"
  >
    <template v-if="historyRowSellsData">
      <template v-if="historyRowSellsData.stocks.length">
        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Stocks</p>
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
            <tr v-for="r in historyRowSellsData.stocks" :key="r.id" class="border-b border-gray-50 dark:border-gray-700">
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
                {{ formatCurrency(historyRowSellsData.stocks.reduce((s, r) => s + r.sellPrice * r.qty, 0)) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </template>
      <template v-if="historyRowSellsData.etfRows.length">
        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">ETFs</p>
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
            <tr v-for="r in historyRowSellsData.etfRows" :key="r.id" class="border-b border-gray-50 dark:border-gray-700">
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
                {{ formatCurrency(historyRowSellsData.etfRows.reduce((s, r) => s + r.sellPrice * r.qty, 0)) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </template>
      <template v-if="historyRowSellsData.commodities.length">
        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Commodity ETFs</p>
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
            <tr v-for="r in historyRowSellsData.commodities" :key="r.id" class="border-b border-gray-50 dark:border-gray-700">
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
                {{ formatCurrency(historyRowSellsData.commodities.reduce((s, r) => s + r.sellPrice * r.qty, 0)) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </template>
      <p
        v-if="!historyRowSellsData.stocks.length && !historyRowSellsData.etfRows.length && !historyRowSellsData.commodities.length"
        class="text-gray-400 text-sm"
      >
        No positions closed this month.
      </p>
      <div class="border-t dark:border-gray-600 pt-2 mt-2 flex justify-between font-bold text-base">
        <span>Total Inflow</span>
        <span class="text-green-600 dark:text-green-400">{{
          formatCurrency(
            historyRowSellsData.stocks.reduce((s, r) => s + r.sellPrice * r.qty, 0) +
            historyRowSellsData.etfRows.reduce((s, r) => s + r.sellPrice * r.qty, 0) +
            historyRowSellsData.commodities.reduce((s, r) => s + r.sellPrice * r.qty, 0),
          )
        }}</span>
      </div>
    </template>
  </Dialog>

  <!-- History Row: Total Purchases Sub-dialog -->
  <Dialog
    :visible="historyRowDrilldown?.type === 'hr-buys'"
    modal
    :header="`Total Purchases — ${historyRowDrilldown?.monthLabel ?? ''}`"
    :style="{ width: '44rem' }"
    :content-style="{ maxHeight: '72vh', overflowY: 'auto' }"
    @update:visible="(v) => { if (!v) historyRowDrilldown = null }"
  >
    <template v-if="historyRowBuysData">
      <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Stocks &amp; ETFs</p>
      <template v-if="historyRowBuysData.openPos.length">
        <p class="text-xs text-gray-400 uppercase tracking-wide mb-1 pl-1">Open Positions</p>
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
            <tr v-for="r in historyRowBuysData.openPos" :key="r.id" class="border-b border-gray-50 dark:border-gray-700">
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
                {{ formatCurrency(-historyRowBuysData.openPos.reduce((s, r) => s + r.buyPrice * r.qty, 0)) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </template>
      <template v-if="historyRowBuysData.closedPos.length">
        <p class="text-xs text-gray-400 uppercase tracking-wide mb-1 pl-1">Closed Positions (buy leg)</p>
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
            <tr v-for="r in historyRowBuysData.closedPos" :key="r.id" class="border-b border-gray-50 dark:border-gray-700">
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
                {{ formatCurrency(-historyRowBuysData.closedPos.reduce((s, r) => s + r.buyRate * r.qty, 0)) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </template>
      <template v-if="historyRowBuysData.etfRows.length">
        <p class="text-xs text-gray-400 uppercase tracking-wide mb-1 pl-1">ETFs</p>
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
            <tr v-for="r in historyRowBuysData.etfRows" :key="r.id" class="border-b border-gray-50 dark:border-gray-700">
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
                {{ formatCurrency(-historyRowBuysData.etfRows.reduce((s, r) => s + r.buyPrice * r.qty, 0)) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </template>
      <p
        v-if="!historyRowBuysData.openPos.length && !historyRowBuysData.closedPos.length && !historyRowBuysData.etfRows.length"
        class="text-gray-400 text-sm mb-3 pl-1"
      >
        No stock or ETF purchases this month.
      </p>

      <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 mt-2">Commodities</p>
      <template v-if="historyRowBuysData.openComm.length">
        <p class="text-xs text-gray-400 uppercase tracking-wide mb-1 pl-1">Open Positions</p>
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
            <tr v-for="r in historyRowBuysData.openComm" :key="r.id" class="border-b border-gray-50 dark:border-gray-700">
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
                {{ formatCurrency(-historyRowBuysData.openComm.reduce((s, r) => s + r.buyPrice * r.qty, 0)) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </template>
      <template v-if="historyRowBuysData.closedComm.length">
        <p class="text-xs text-gray-400 uppercase tracking-wide mb-1 pl-1">Closed Positions (buy leg)</p>
        <table class="w-full text-sm mb-4">
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
            <tr v-for="r in historyRowBuysData.closedComm" :key="r.id" class="border-b border-gray-50 dark:border-gray-700">
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
                {{ formatCurrency(-historyRowBuysData.closedComm.reduce((s, r) => s + r.buyRate * r.qty, 0)) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </template>
      <p
        v-if="!historyRowBuysData.openComm.length && !historyRowBuysData.closedComm.length"
        class="text-gray-400 text-sm mb-3 pl-1"
      >
        No commodity ETF purchases this month.
      </p>

      <div class="border-t dark:border-gray-600 pt-2 mt-2 flex justify-between font-bold text-base">
        <span>Total Purchases</span>
        <span class="text-red-600 dark:text-red-400">{{
          formatCurrency(-(
            historyRowBuysData.openPos.reduce((s, r) => s + r.buyPrice * r.qty, 0) +
            historyRowBuysData.closedPos.reduce((s, r) => s + r.buyRate * r.qty, 0) +
            historyRowBuysData.etfRows.reduce((s, r) => s + r.buyPrice * r.qty, 0) +
            historyRowBuysData.openComm.reduce((s, r) => s + r.buyPrice * r.qty, 0) +
            historyRowBuysData.closedComm.reduce((s, r) => s + r.buyRate * r.qty, 0)
          ))
        }}</span>
      </div>
    </template>
  </Dialog>

  <!-- History Row: Cash Balance Drawdown Sub-dialog -->
  <Dialog
    :visible="historyRowDrilldown?.type === 'hr-recycled'"
    modal
    :header="`Cash Balance Drawdown — ${historyRowDrilldown?.monthLabel ?? ''}`"
    :style="{ width: '28rem' }"
    @update:visible="(v) => { if (!v) historyRowDrilldown = null }"
  >
    <template v-if="historyRowRecycledInfo">
      <div class="space-y-0 text-sm">
        <div class="flex justify-between py-2 border-b dark:border-gray-700">
          <span class="text-gray-500">Opening cash balance</span>
          <span
            class="font-medium"
            :class="historyRowRecycledInfo.openingBalance > 0 ? 'text-amber-600 dark:text-amber-400' : ''"
          >{{ formatCurrency(historyRowRecycledInfo.openingBalance) }}</span>
        </div>
        <div class="flex justify-between py-2 border-b dark:border-gray-700">
          <span class="text-gray-500">+ Sell proceeds this month</span>
          <span class="font-medium text-green-600 dark:text-green-400">{{ formatCurrency(historyRowRecycledInfo.sellProceeds) }}</span>
        </div>
        <div class="flex justify-between py-2 border-b-2 dark:border-gray-600 font-semibold">
          <span class="text-gray-600 dark:text-gray-300">= Available before purchases</span>
          <span :class="historyRowRecycledInfo.availableBalance > 0 ? 'text-amber-600 dark:text-amber-400' : ''">
            {{ formatCurrency(historyRowRecycledInfo.availableBalance) }}
          </span>
        </div>
        <div class="flex justify-between py-2 border-b dark:border-gray-700">
          <span class="text-gray-500">Total purchases this month</span>
          <span class="font-medium text-red-600 dark:text-red-400">{{ formatCurrency(-historyRowRecycledInfo.totalBuys) }}</span>
        </div>
        <div class="flex justify-between py-2 border-b-2 border-gray-300 dark:border-gray-500 font-bold text-base">
          <span>Used from cash balance</span>
          <span class="text-amber-600 dark:text-amber-400">{{ formatCurrency(historyRowRecycledInfo.recycled) }}</span>
        </div>
        <div class="flex justify-between py-2 font-semibold">
          <span class="text-gray-500">Closing cash balance</span>
          <span :class="historyRowRecycledInfo.closingBalance > 0 ? 'text-amber-600 dark:text-amber-400' : ''">
            {{ formatCurrency(historyRowRecycledInfo.closingBalance) }}
          </span>
        </div>
      </div>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-3">
        Used from cash balance = min(available, total purchases). Fresh salary
        = total purchases − used from cash balance.
      </p>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '~/stores/data'
import { formatCurrency } from '~/composables/useCalculations'
import { calcBrokerBalanceHistory } from '~/composables/useBudgetCalculations'

const props = defineProps({
  visible: { type: Boolean, required: true },
  year: { type: Number, default: null },
  month: { type: Number, default: null },
  monthLabel: { type: String, default: '' },
})

defineEmits(['close'])

const store = useDataStore()
const historyRowDrilldown = ref(null)

const currentPrefix = computed(() => {
  if (!props.year || !props.month) return null
  return `${props.year}-${String(props.month).padStart(2, '0')}`
})

const balanceHistory = computed(() => {
  if (!props.visible || !props.year || !props.month) return []
  return calcBrokerBalanceHistory(store, props.year, props.month)
})

const historyRowSellsData = computed(() => {
  if (historyRowDrilldown.value?.type !== 'hr-sells') return null
  const p = historyRowDrilldown.value.prefix
  return {
    stocks: store.tables.closedPositions.filter((r) => r.sellDate?.startsWith(p)),
    etfRows: store.tables.closedEtfs.filter((r) => r.sellDate?.startsWith(p)),
    commodities: store.tables.closedCommodityEtfs.filter((r) => r.sellDate?.startsWith(p)),
  }
})

const historyRowBuysData = computed(() => {
  if (historyRowDrilldown.value?.type !== 'hr-buys') return null
  const p = historyRowDrilldown.value.prefix
  return {
    openPos: store.tables.openPositions.filter((r) => r.buyDate?.startsWith(p)),
    closedPos: store.tables.closedPositions.filter((r) => r.buyDate?.startsWith(p)),
    etfRows: store.tables.etfs.filter((r) => r.buyDate?.startsWith(p)),
    openComm: store.tables.commodityEtfs.filter((r) => r.buyDate?.startsWith(p)),
    closedComm: store.tables.closedCommodityEtfs.filter((r) => r.buyDate?.startsWith(p)),
  }
})

const historyRowRecycledInfo = computed(() => {
  if (historyRowDrilldown.value?.type !== 'hr-recycled') return null
  const prefix = historyRowDrilldown.value.prefix
  const idx = balanceHistory.value.findIndex((r) => r.prefix === prefix)
  if (idx < 0) return null
  const row = balanceHistory.value[idx]
  const openingBalance = idx > 0 ? balanceHistory.value[idx - 1].balance : 0
  return {
    openingBalance,
    sellProceeds: row.sellProceeds,
    availableBalance: openingBalance + row.sellProceeds,
    totalBuys: row.totalBuys,
    recycled: row.recycled,
    closingBalance: row.balance,
  }
})
</script>
