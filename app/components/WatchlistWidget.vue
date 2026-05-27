<template>
  <section
    aria-label="Watchlist summary"
    class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
    data-testid="watchlist-widget"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">👁 Watchlist</h2>
      <NuxtLink
        to="/watchlist"
        class="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        data-testid="see-all-link"
      >
        See all ({{ store.tables.watchlist.length }}) →
      </NuxtLink>
    </div>

    <!-- SELL alerts for held positions -->
    <div
      v-if="sellAlerts.length"
      class="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 space-y-1"
      role="alert"
      data-testid="sell-alerts"
    >
      <p class="text-xs font-semibold text-red-700 dark:text-red-400">
        ⚠️ Sell signal on held positions
      </p>
      <ul class="list-none p-0 m-0 space-y-0.5">
        <li
          v-for="entry in sellAlerts"
          :key="entry.id"
          class="text-xs text-red-600 dark:text-red-300"
        >
          ▼ {{ entry.stock }} — score {{ entry.score }}/100
        </li>
      </ul>
    </div>

    <!-- Top BUY picks -->
    <div v-if="topBuys.length" data-testid="top-buys">
      <p class="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Top BUY picks</p>
      <ul class="space-y-2 list-none p-0 m-0">
        <li
          v-for="entry in topBuys"
          :key="entry.id"
          class="flex items-center gap-3"
          :data-testid="`buy-item-${entry.stock}`"
        >
          <span class="text-xs font-semibold text-gray-800 dark:text-gray-200 w-24 truncate">
            {{ entry.stock }}
          </span>
          <!-- Score bar -->
          <div class="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden" role="progressbar" :aria-valuenow="entry.score" aria-valuemin="0" aria-valuemax="100" :aria-label="`${entry.stock} score ${entry.score}`">
            <div
              :style="{ width: `${entry.score}%` }"
              class="h-full bg-green-500 rounded-full"
            />
          </div>
          <span class="text-xs text-gray-500 dark:text-gray-400 w-10 text-right shrink-0" :aria-label="`Score: ${entry.score} out of 100`">
            {{ entry.score }}/100
          </span>
          <a
            v-if="entry.vitepressUrl"
            :href="entry.vitepressUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs text-blue-400 hover:text-blue-600 shrink-0"
            aria-label="Open analysis"
          >
            📄
          </a>
        </li>
      </ul>
    </div>

    <!-- No buy signals state -->
    <p
      v-else-if="!sellAlerts.length"
      class="text-xs text-gray-400 dark:text-gray-500"
    >
      No BUY signals yet. <NuxtLink to="/watchlist" class="text-blue-400 hover:text-blue-600">Add stocks →</NuxtLink>
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDataStore } from '~/stores/data'
import type { WatchlistEntry } from '~/types'

const store = useDataStore()

// Top BUY picks (score sorted, max 5)
const topBuys = computed<WatchlistEntry[]>(() =>
  (store.tables.watchlist as WatchlistEntry[])
    .filter(e => e.signal === 'BUY')
    .sort((a, b) => b.score - a.score)
    .slice(0, 5),
)

// SELL alerts: watchlist entries with SELL signal that match a held open position
const heldStocks = computed<Set<string>>(() => {
  const names = [
    ...store.tables.openPositions.map(p => p.stock.toUpperCase()),
    ...store.tables.etfs.map(p => p.stock.toUpperCase()),
  ]
  return new Set(names)
})

const sellAlerts = computed<WatchlistEntry[]>(() =>
  (store.tables.watchlist as WatchlistEntry[]).filter(
    e => e.signal === 'SELL' && heldStocks.value.has(e.stock.toUpperCase()),
  ),
)
</script>
