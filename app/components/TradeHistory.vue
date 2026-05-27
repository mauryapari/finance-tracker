<template>
  <section aria-label="Trade History" class="mt-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 p-4 py-8 space-y-4">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-base font-semibold text-surface-800 dark:text-surface-100">Trade History</h2>
        <!-- Year stats -->
        <p class="mt-1 text-sm text-surface-500 dark:text-surface-400 flex flex-wrap gap-x-2 gap-y-0.5" aria-live="polite" data-testid="year-stats">
          <template v-if="yearStats.trades > 0">
            <span class="font-medium text-surface-700 dark:text-surface-200">
              {{ yearStats.trades }} trade{{ yearStats.trades !== 1 ? 's' : '' }}
            </span>
            <span aria-hidden="true" class="text-surface-300 dark:text-surface-600">·</span>
            <span>{{ yearStats.activeDays }} active day{{ yearStats.activeDays !== 1 ? 's' : '' }}</span>
            <span aria-hidden="true" class="text-surface-300 dark:text-surface-600">·</span>
            <span class="text-green-600 dark:text-green-400 font-medium">↑&nbsp;₹{{ formatCurrency(yearStats.buyValue) }}</span>
            <template v-if="yearStats.sellValue > 0">
              <span aria-hidden="true" class="text-surface-300 dark:text-surface-600">·</span>
              <span class="text-red-500 dark:text-red-400 font-medium">↓&nbsp;₹{{ formatCurrency(yearStats.sellValue) }}</span>
            </template>
          </template>
          <template v-else>No trades recorded</template>
        </p>
      </div>

      <!-- Year selector -->
      <select
        :value="selectedYear"
        class="shrink-0 text-sm font-semibold bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-2 text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer min-w-[76px] text-center appearance-none"
        aria-label="Select year"
        data-testid="year-select"
        @change="selectedYear = Number(($event.target as HTMLSelectElement).value)"
      >
        <option
          v-for="yr in availableYears"
          :key="yr"
          :value="yr"
          class="bg-white dark:bg-gray-900 text-center"
        >{{ yr }}</option>
      </select>
    </div>

    <!-- Heatmap calendar -->
    <div ref="heatmapRef" class="w-full">
      <!-- Month labels -->
      <div class="flex mb-1" :style="{ paddingLeft: DOW_COL_WIDTH + 'px' }">
        <template v-for="(label, idx) in monthLabels" :key="idx">
          <span
            class="text-[10px] text-surface-400 dark:text-surface-500 select-none"
            :style="{ width: label.width + 'px', minWidth: label.width + 'px' }"
          >{{ label.name }}</span>
        </template>
      </div>

      <!-- Grid: day-of-week labels + week columns -->
      <div class="flex" :style="{ gap: CELL_GAP + 'px' }">
        <!-- Day-of-week labels -->
        <div class="flex flex-col shrink-0" :style="{ gap: CELL_GAP + 'px', width: DOW_TEXT_WIDTH + 'px', marginRight: CELL_GAP + 'px' }">
          <span
            v-for="day in DOW_LABELS"
            :key="day.label"
            class="text-[10px] text-surface-400 dark:text-surface-500 leading-none select-none flex items-center"
            :style="{ height: cellSize + 'px', visibility: day.visible ? 'visible' : 'hidden' }"
          >{{ day.label }}</span>
        </div>

        <!-- Week columns -->
        <div
          v-for="(week, wi) in weeks"
          :key="wi"
          class="flex flex-col"
          :style="{ gap: CELL_GAP + 'px' }"
        >
          <template v-for="(day, di) in week" :key="di">
            <!-- null: padding outside year bounds — invisible spacer -->
            <div
              v-if="!day"
              class="invisible"
              :style="{ width: cellSize + 'px', height: cellSize + 'px' }"
            />
            <!-- future date: non-interactive placeholder -->
            <div
              v-else-if="day.date > todayISO"
              :data-testid="`heatmap-day-${day.date}`"
              :aria-label="`${day.date}: future`"
              class="rounded-full border border-dashed border-surface-300 dark:border-surface-700 opacity-30"
              :style="{ width: cellSize + 'px', height: cellSize + 'px' }"
            />
            <!-- past or today: interactive button -->
            <button
              v-else
              :data-testid="`heatmap-day-${day.date}`"
              :aria-label="cellAriaLabel(day)"
              :aria-pressed="selectedDate === day.date"
              :title="cellTooltip(day)"
              :class="[
                'rounded-full transition-all duration-150 border border-gray-300 dark:border-gray-600',
                'cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400',
                cellColorClass(day),
                selectedDate === day.date ? 'ring-2 ring-emerald-500 dark:ring-emerald-400' : '',
              ]"
              :style="{ width: cellSize + 'px', height: cellSize + 'px' }"
              @click="selectDate(day.date)"
              @keydown.enter="selectDate(day.date)"
              @keydown.space.prevent="selectDate(day.date)"
            />
          </template>
        </div>
      </div>

      <!-- Legend -->
      <div class="flex items-center gap-2 mt-8" :style="{ paddingLeft: DOW_COL_WIDTH + 'px' }">
        <span class="text-[10px] text-surface-400 dark:text-surface-500">Less</span>
        <div v-for="cls in LEGEND" :key="cls" :class="['rounded-full', cls]" :style="{ width: cellSize + 'px', height: cellSize + 'px' }" />
        <span class="text-[10px] text-surface-400 dark:text-surface-500">More</span>
      </div>
    </div>

    <!-- Trade list for selected date -->
    <Transition name="slide-down">
      <div v-if="selectedDate" class="pt-3">
        <!-- Selected date header -->
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-medium text-surface-700 dark:text-surface-200">
            Trades on {{ formattedSelectedDate }}
          </h3>
          <button
            class="text-surface-400 dark:text-surface-500 hover:text-surface-700 dark:hover:text-surface-200 transition-colors rounded focus:outline-none focus:ring-2 focus:ring-emerald-400 px-1"
            aria-label="Close trade list"
            data-testid="close-trade-list"
            @click="clearSelection"
          >
            ✕
          </button>
        </div>

        <!-- Trades table -->
        <div v-if="selectedDateEvents.length" class="overflow-x-auto">
          <table class="w-full text-sm border-collapse" data-testid="trade-list-table">
            <thead>
              <tr class="text-left text-xs text-surface-400 dark:text-surface-500 border-b border-surface-200 dark:border-surface-700">
                <th class="pb-1 pr-3 font-medium">Type</th>
                <th class="pb-1 pr-3 font-medium">Stock</th>
                <th class="pb-1 pr-3 font-medium text-right">Qty</th>
                <th class="pb-1 pr-3 font-medium text-right">Price (₹)</th>
                <th class="pb-1 font-medium text-right">Value (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="event in selectedDateEvents"
                :key="event.id"
                class="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                :data-testid="`trade-row-${event.id}`"
              >
                <!-- BUY / SELL badge -->
                <td class="py-1.5 pr-3">
                  <span
                    :class="[
                      'inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold',
                      event.type === 'BUY'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
                    ]"
                    :aria-label="event.type"
                  >{{ event.type }}</span>
                </td>

                <!-- Stock name as link -->
                <td class="py-1.5 pr-3">
                  <NuxtLink
                    :to="event.linkTo"
                    class="font-medium text-surface-800 dark:text-surface-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors focus:outline-none focus:underline"
                    :aria-label="`View ${event.stock} in ${routeLabel(event.linkTo)}`"
                    :data-testid="`trade-link-${event.id}`"
                  >{{ event.stock }}</NuxtLink>
                </td>

                <td class="py-1.5 pr-3 text-right text-surface-600 dark:text-surface-300 tabular-nums">
                  {{ event.qty }}
                </td>
                <td class="py-1.5 pr-3 text-right text-surface-600 dark:text-surface-300 tabular-nums">
                  {{ formatCurrency(event.price) }}
                </td>
                <td class="py-1.5 text-right font-medium text-surface-800 dark:text-surface-100 tabular-nums">
                  {{ formatCurrency(event.value) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty state -->
        <p v-else class="text-sm text-surface-400 dark:text-surface-500 py-2" data-testid="no-trades-msg">
          No trades on this date.
        </p>
      </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTradeHistory } from '~/composables/useTradeHistory'
import { formatCurrency } from '~/composables/useCalculations'
import type { HeatmapDay } from '~/types'

// ── Constants ────────────────────────────────────────────────────────────────

/** Gap between cells and week columns, in px */
const CELL_GAP = 3

/** Width of the "Mon/Wed/Fri" label text, in px */
const DOW_TEXT_WIDTH = 20

/** Total DOW column width including the trailing gap = text + gap */
const DOW_COL_WIDTH = DOW_TEXT_WIDTH + CELL_GAP

const DOW_LABELS = [
  { label: 'Mon', visible: true },
  { label: '', visible: false },
  { label: 'Wed', visible: true },
  { label: '', visible: false },
  { label: 'Fri', visible: true },
  { label: '', visible: false },
  { label: 'Sun', visible: false },
]

const LEGEND = [
  'bg-transparent border border border-surface-200 dark:border-surface-700',
  'bg-emerald-200 dark:bg-emerald-900',
  'bg-emerald-400 dark:bg-emerald-700',
  'bg-emerald-600 dark:bg-emerald-500',
]

const ROUTE_LABELS: Record<string, string> = {
  '/open-positions': 'Open Positions',
  '/closed-positions': 'Closed Positions',
  '/etfs': 'ETFs',
  '/closed-etfs': 'Closed ETFs',
  '/commodity-etfs': 'Commodity ETFs',
  '/closed-commodity-etfs': 'Closed Commodity ETFs',
}

// ── Responsive cell sizing ───────────────────────────────────────────────────

const heatmapRef = ref<HTMLElement | null>(null)
const containerWidth = ref(0)

let ro: ResizeObserver | null = null

onMounted(() => {
  if (!heatmapRef.value) return
  containerWidth.value = heatmapRef.value.offsetWidth
  ro = new ResizeObserver(([entry]) => {
    containerWidth.value = entry.contentRect.width
  })
  ro.observe(heatmapRef.value)
})

onUnmounted(() => {
  ro?.disconnect()
  ro = null
})

/** Dynamically sized cells — fills container width across all week columns */
const cellSize = computed(() => {
  const n = weeks.value.length
  if (n === 0 || containerWidth.value === 0) return 12
  // containerWidth = DOW_COL_WIDTH + n * cellSize + (n-1) * CELL_GAP
  const available = containerWidth.value - DOW_COL_WIDTH
  const size = Math.floor((available - (n - 1) * CELL_GAP) / n)
  return Math.max(10, size)
})

// ── Composable ───────────────────────────────────────────────────────────────

const {
  heatmapData,
  selectedYear,
  availableYears,
  yearStats,
  selectedDate,
  selectedDateEvents,
  selectDate,
  clearSelection,
} = useTradeHistory()

// ── Today ISO (local timezone) ───────────────────────────────────────────────

/** Today's date as YYYY-MM-DD in local timezone (avoids UTC offset issues) */
const todayISO = computed(() => {
  const t = new Date()
  const y = t.getFullYear()
  const m = String(t.getMonth() + 1).padStart(2, '0')
  const d = String(t.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
})

// ── Heatmap grid construction ────────────────────────────────────────────────

/**
 * Build a full-year grid of week columns (each week = 7 days Mon→Sun).
 * Null = day outside the year bounds (padding cells, rendered invisible).
 * Future dates (> todayISO) are included as HeatmapDay with count:0 — the
 * template renders them as non-interactive dashed placeholders.
 */
const weeks = computed<(HeatmapDay | null)[][]>(() => {
  const days = heatmapData.value

  const lookup: Record<string, HeatmapDay> = {}
  for (const d of days) lookup[d.date] = d

  const today = new Date()
  const year = selectedYear.value
  const yearStart = new Date(year, 0, 1)  // Jan 1
  const yearEnd = new Date(year, 11, 31)  // Dec 31 — always render full year

  if (yearStart > today) return []

  // Grid start: Monday on or before Jan 1
  const startDow = yearStart.getDay() // 0=Sun…6=Sat
  const offsetToMon = startDow === 0 ? -6 : 1 - startDow
  const gridStart = new Date(yearStart)
  gridStart.setDate(gridStart.getDate() + offsetToMon)

  // Grid end: Sunday on or after Dec 31 (fills out the last week column)
  const endDow = yearEnd.getDay()
  const offsetToSun = endDow === 0 ? 0 : 7 - endDow
  const gridEnd = new Date(yearEnd)
  gridEnd.setDate(gridEnd.getDate() + offsetToSun)

  const result: (HeatmapDay | null)[][] = []
  const cursor = new Date(gridStart)

  while (cursor <= gridEnd) {
    const week: (HeatmapDay | null)[] = []
    for (let d = 0; d < 7; d++) {
      const y = cursor.getFullYear()
      const mo = String(cursor.getMonth() + 1).padStart(2, '0')
      const dy = String(cursor.getDate()).padStart(2, '0')
      const iso = `${y}-${mo}-${dy}`
      const ct = cursor.getTime()

      if (ct < yearStart.getTime() || ct > yearEnd.getTime()) {
        // Outside year bounds → padding (invisible)
        week.push(null)
      } else {
        // Inside year → use trade data if present, else synthetic empty day
        week.push(lookup[iso] ?? { date: iso, count: 0, value: 0 })
      }
      cursor.setDate(cursor.getDate() + 1)
    }
    result.push(week)
  }

  return result
})

/** Month labels with pixel widths spanning the week columns they cover */
const monthLabels = computed(() => {
  const labels: { name: string; width: number }[] = []
  const colWidth = cellSize.value + CELL_GAP

  let prevMonth = ''
  let curWidth = 0

  for (const week of weeks.value) {
    const day = week.find(Boolean)
    const month = day
      ? new Date(day.date).toLocaleString('en-IN', { month: 'short' })
      : ''

    if (month !== prevMonth) {
      if (prevMonth !== '') labels.push({ name: prevMonth, width: curWidth })
      prevMonth = month
      curWidth = colWidth
    } else {
      curWidth += colWidth
    }
  }
  if (prevMonth) labels.push({ name: prevMonth, width: curWidth })
  return labels
})

// ── Helpers ──────────────────────────────────────────────────────────────────

function cellColorClass(day: HeatmapDay): string {
  if (day.count === 0) return 'bg-transparent'
  if (day.count === 1) return 'bg-emerald-200 dark:bg-emerald-900'
  if (day.count <= 3) return 'bg-emerald-400 dark:bg-emerald-700'
  return 'bg-emerald-600 dark:bg-emerald-500'
}

function cellAriaLabel(day: HeatmapDay): string {
  const d = new Date(day.date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  if (day.count === 0) return `${d} — no trades`
  return `${d} — ${day.count} trade${day.count > 1 ? 's' : ''}`
}

function cellTooltip(day: HeatmapDay): string {
  if (day.count === 0) return new Date(day.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  return `${new Date(day.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${day.count} trade${day.count > 1 ? 's' : ''} · ₹${formatCurrency(day.value)}`
}

function routeLabel(route: string): string {
  return ROUTE_LABELS[route] ?? route
}

const formattedSelectedDate = computed(() => {
  if (!selectedDate.value) return ''
  return new Date(selectedDate.value).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
})
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .slide-down-enter-active,
  .slide-down-leave-active {
    transition: none;
  }
}
</style>
