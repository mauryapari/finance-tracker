<template>
  <div
    class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
    :data-testid="`watchlist-card-${entry.stock}`"
  >
    <!-- Header row -->
    <div class="flex items-start justify-between gap-2">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="font-semibold text-gray-900 dark:text-gray-100 text-base">{{ entry.stock }}</span>
        <span class="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
          {{ entry.stockExchange }}
        </span>
        <!-- Signal badge — color + text so color is not the only indicator (a11y) -->
        <span
          :class="signalClass"
          class="text-xs font-bold px-2 py-0.5 rounded-full"
          :aria-label="`Signal: ${entry.signal}`"
          data-testid="signal-badge"
        >
          {{ signalIcon }} {{ entry.signal }}
        </span>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-1 shrink-0">
        <a
          v-if="entry.vitepressUrl"
          :href="entry.vitepressUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded border border-blue-300 dark:border-blue-600"
          aria-label="Open full analysis"
          data-testid="analysis-link"
        >
          📄 Analysis
        </a>
        <button
          class="p-1.5 rounded text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Edit watchlist entry"
          data-testid="edit-btn"
          @click="$emit('edit', entry)"
        >
          <i class="pi pi-pencil text-sm" />
        </button>
        <button
          class="p-1.5 rounded text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Delete watchlist entry"
          data-testid="delete-btn"
          @click="$emit('delete', entry)"
        >
          <i class="pi pi-trash text-sm" />
        </button>
      </div>
    </div>

    <!-- Score bar -->
    <div>
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs text-gray-500 dark:text-gray-400">AI Score</span>
        <span class="text-xs font-semibold text-gray-700 dark:text-gray-300" :aria-label="`Score: ${entry.score} out of 100`">
          {{ entry.score }}/100
        </span>
      </div>
      <div class="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden" role="progressbar" :aria-valuenow="entry.score" aria-valuemin="0" aria-valuemax="100">
        <div
          :style="{ width: `${entry.score}%` }"
          :class="scoreBarClass"
          class="h-full rounded-full transition-all"
        />
      </div>
    </div>

    <!-- Notes -->
    <p v-if="entry.notes" class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
      {{ entry.notes }}
    </p>

    <!-- Expand/collapse checklist -->
    <button
      class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      :aria-expanded="expanded"
      aria-controls="checklist-panel"
      data-testid="expand-btn"
      @click="expanded = !expanded"
    >
      <i :class="expanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" class="text-xs" />
      {{ expanded ? 'Hide' : 'Show' }} conditions
    </button>

    <div
      v-if="expanded"
      id="checklist-panel"
      class="space-y-3 pt-1"
      data-testid="checklist-panel"
    >
      <ChecklistSection
        v-if="entry.buyConditions.length"
        title="✅ Buy conditions"
        :items="entry.buyConditions"
        color="green"
      />
      <ChecklistSection
        v-if="entry.sellConditions.length"
        title="🚨 Sell conditions"
        :items="entry.sellConditions"
        color="red"
      />
      <ChecklistSection
        v-if="entry.holdConditions.length"
        title="⏸ Hold conditions"
        :items="entry.holdConditions"
        color="yellow"
      />
    </div>

    <!-- Footer: last updated -->
    <p class="text-xs text-gray-400 dark:text-gray-500 text-right">
      Updated {{ entry.lastUpdated }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { WatchlistEntry, WatchlistSignal } from '~/types'

const { entry } = defineProps<{ entry: WatchlistEntry }>()

defineEmits<{
  edit: [entry: WatchlistEntry]
  delete: [entry: WatchlistEntry]
}>()

const expanded = ref(false)

const SIGNAL_CLASSES: Record<WatchlistSignal, string> = {
  BUY:   'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  SELL:  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  HOLD:  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  WATCH: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
}

const SIGNAL_ICONS: Record<WatchlistSignal, string> = {
  BUY:   '▲',
  SELL:  '▼',
  HOLD:  '⏸',
  WATCH: '👁',
}

const signalClass = computed(() => SIGNAL_CLASSES[entry.signal])
const signalIcon  = computed(() => SIGNAL_ICONS[entry.signal])

const scoreBarClass = computed(() => {
  if (entry.score >= 70) return 'bg-green-500'
  if (entry.score >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
})
</script>
