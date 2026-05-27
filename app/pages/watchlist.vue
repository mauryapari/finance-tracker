<template>
  <main class="p-4 space-y-4">
    <!-- Page header -->
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">👁 Watchlist</h1>
      <Button
        label="Add stock"
        icon="pi pi-plus"
        data-testid="add-btn"
        @click="openAdd"
      />
    </div>

    <!-- Filter + sort bar -->
    <section aria-label="Filter and sort watchlist" class="flex flex-wrap items-center gap-2">
      <!-- Signal filter chips -->
      <div class="flex flex-wrap gap-1" role="group" aria-label="Filter by signal">
        <button
          v-for="sig in FILTER_OPTIONS"
          :key="sig"
          :class="[
            'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
            activeFilter === sig
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-400',
          ]"
          :aria-pressed="activeFilter === sig"
          :data-testid="`filter-${sig}`"
          @click="activeFilter = sig"
        >
          {{ sig }}
        </button>
      </div>

      <div class="ml-auto flex items-center gap-2">
        <label for="sort-select" class="text-xs text-gray-500 dark:text-gray-400">Sort:</label>
        <select
          id="sort-select"
          v-model="sortBy"
          class="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          data-testid="sort-select"
        >
          <option value="score">Score ↓</option>
          <option value="date">Date ↓</option>
          <option value="stock">Stock A–Z</option>
        </select>
      </div>
    </section>

    <!-- Entry count -->
    <p v-if="filtered.length" class="text-xs text-gray-400 dark:text-gray-500">
      {{ filtered.length }} {{ filtered.length === 1 ? 'stock' : 'stocks' }}
    </p>

    <!-- Cards grid -->
    <div
      v-if="filtered.length"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      data-testid="watchlist-grid"
    >
      <WatchlistCard
        v-for="entry in filtered"
        :key="entry.id"
        :entry="entry"
        @edit="openEdit"
        @delete="confirmDelete"
      />
    </div>

    <!-- Empty state -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600 space-y-2"
      data-testid="empty-state"
    >
      <span class="text-4xl" aria-hidden="true">👁</span>
      <p class="text-sm font-medium">
        {{ store.tables.watchlist.length ? 'No stocks match this filter' : 'No stocks on your watchlist yet' }}
      </p>
      <Button
        v-if="!store.tables.watchlist.length"
        label="Add your first stock"
        severity="secondary"
        outlined
        size="small"
        @click="openAdd"
      />
    </div>

    <!-- Add / Edit form modal -->
    <WatchlistForm
      v-if="formVisible"
      :entry="editingEntry ?? undefined"
      @save="handleSave"
      @cancel="closeForm"
    />

    <!-- Delete confirmation dialog -->
    <Dialog
      v-if="deletingEntry"
      :visible="true"
      modal
      header="Remove from watchlist"
      :style="{ width: '380px' }"
      @update:visible="deletingEntry = null"
    >
      <p class="text-sm text-gray-700 dark:text-gray-300">
        Remove <strong>{{ deletingEntry.stock }}</strong> from your watchlist? This cannot be undone.
      </p>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancel" severity="secondary" outlined data-testid="delete-cancel-btn" @click="deletingEntry = null" />
          <Button label="Remove" severity="danger" data-testid="delete-confirm-btn" @click="handleDelete" />
        </div>
      </template>
    </Dialog>
  </main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDataStore } from '~/stores/data'
import type { WatchlistEntry, WatchlistSignal } from '~/types'

const store = useDataStore()

// ── Filter / sort ──────────────────────────────────────────────────────────
type FilterOption = 'ALL' | WatchlistSignal
const FILTER_OPTIONS: FilterOption[] = ['ALL', 'BUY', 'SELL', 'HOLD', 'WATCH']

const activeFilter = ref<FilterOption>('ALL')
const sortBy       = ref<'score' | 'date' | 'stock'>('score')

const filtered = computed<WatchlistEntry[]>(() => {
  let list = store.tables.watchlist as WatchlistEntry[]

  if (activeFilter.value !== 'ALL') {
    list = list.filter(e => e.signal === activeFilter.value)
  }

  return [...list].sort((a, b) => {
    if (sortBy.value === 'score') return b.score - a.score
    if (sortBy.value === 'date')  return b.lastUpdated.localeCompare(a.lastUpdated)
    return a.stock.localeCompare(b.stock)
  })
})

// ── Add / edit form ────────────────────────────────────────────────────────
const formVisible   = ref(false)
const editingEntry  = ref<WatchlistEntry | null>(null)

function openAdd() {
  editingEntry.value = null
  formVisible.value  = true
}

function openEdit(entry: WatchlistEntry) {
  editingEntry.value = entry
  formVisible.value  = true
}

function closeForm() {
  formVisible.value  = false
  editingEntry.value = null
}

function handleSave(entry: WatchlistEntry) {
  if (editingEntry.value) {
    store.updateRow('watchlist', entry.id, entry)
  } else {
    store.addRow('watchlist', entry)
  }
  closeForm()
}

// ── Delete ─────────────────────────────────────────────────────────────────
const deletingEntry = ref<WatchlistEntry | null>(null)

function confirmDelete(entry: WatchlistEntry) {
  deletingEntry.value = entry
}

function handleDelete() {
  if (deletingEntry.value) {
    store.deleteRow('watchlist', deletingEntry.value.id)
    deletingEntry.value = null
  }
}
</script>
