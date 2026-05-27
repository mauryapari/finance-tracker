import { ref, computed } from 'vue'
import { useDataStore } from '~/stores/data'
import type { TradeEvent, HeatmapDay } from '~/types'

/** Local calendar date as YYYY-MM-DD (avoids UTC offset issues from toISOString) */
function localISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Route each tableKey maps to */
const TABLE_ROUTES: Record<string, string> = {
  openPositions: '/open-positions',
  closedPositions: '/closed-positions',
  etfs: '/etfs',
  closedEtfs: '/closed-etfs',
  commodityEtfs: '/commodity-etfs',
  closedCommodityEtfs: '/closed-commodity-etfs',
}

/** Derive trade events from a table's rows */
function extractEvents(
  rows: Record<string, unknown>[],
  type: 'BUY' | 'SELL',
  dateField: string,
  priceField: string,
  tableKey: string,
): TradeEvent[] {
  const events: TradeEvent[] = []
  for (const row of rows) {
    const date = row[dateField] as string | undefined
    const price = row[priceField] as number | undefined
    const qty = row['qty'] as number | undefined
    const stock = row['stock'] as string | undefined
    if (!date || !price || !qty || !stock) continue
    events.push({
      id: `${tableKey}-${type.toLowerCase()}-${row['id'] as string}`,
      date,
      type,
      stock,
      qty,
      price,
      value: price * qty,
      tableKey,
      linkTo: TABLE_ROUTES[tableKey] ?? '/',
    })
  }
  return events
}

/** Build HeatmapDay entries for the given year, from Jan 1 to min(Dec 31, today) */
function buildHeatmapGridForYear(
  eventsByDate: Record<string, TradeEvent[]>,
  year: number,
): HeatmapDay[] {
  const today = new Date()
  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year, 11, 31)
  const end = yearEnd < today ? yearEnd : today

  if (yearStart > today) return []

  const days: HeatmapDay[] = []
  const cursor = new Date(yearStart)
  while (cursor <= end) {
    const iso = localISO(cursor)
    const events = eventsByDate[iso] ?? []
    days.push({
      date: iso,
      count: events.length,
      value: events.reduce((s, e) => s + e.value, 0),
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

export function useTradeHistory() {
  const store = useDataStore()

  /** All trade events derived from every table */
  const allEvents = computed<TradeEvent[]>(() => {
    const tables = store.tables
    const raw = [
      ...extractEvents(
        tables.openPositions as unknown as Record<string, unknown>[],
        'BUY', 'buyDate', 'buyPrice', 'openPositions',
      ),
      ...extractEvents(
        tables.closedPositions as unknown as Record<string, unknown>[],
        'BUY', 'buyDate', 'buyRate', 'closedPositions',
      ),
      ...extractEvents(
        tables.closedPositions as unknown as Record<string, unknown>[],
        'SELL', 'sellDate', 'sellPrice', 'closedPositions',
      ),
      ...extractEvents(
        tables.etfs as unknown as Record<string, unknown>[],
        'BUY', 'buyDate', 'buyPrice', 'etfs',
      ),
      ...extractEvents(
        tables.closedEtfs as unknown as Record<string, unknown>[],
        'BUY', 'buyDate', 'buyRate', 'closedEtfs',
      ),
      ...extractEvents(
        tables.closedEtfs as unknown as Record<string, unknown>[],
        'SELL', 'sellDate', 'sellPrice', 'closedEtfs',
      ),
      ...extractEvents(
        tables.commodityEtfs as unknown as Record<string, unknown>[],
        'BUY', 'buyDate', 'buyPrice', 'commodityEtfs',
      ),
      ...extractEvents(
        tables.closedCommodityEtfs as unknown as Record<string, unknown>[],
        'BUY', 'buyDate', 'buyRate', 'closedCommodityEtfs',
      ),
      ...extractEvents(
        tables.closedCommodityEtfs as unknown as Record<string, unknown>[],
        'SELL', 'sellDate', 'sellPrice', 'closedCommodityEtfs',
      ),
    ]
    return raw.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })

  /** Map from ISO date → events on that date */
  const eventsByDate = computed<Record<string, TradeEvent[]>>(() => {
    const map: Record<string, TradeEvent[]> = {}
    for (const e of allEvents.value) {
      if (!map[e.date]) map[e.date] = []
      map[e.date]!.push(e)
    }
    return map
  })

  /** Currently selected year — defaults to current calendar year */
  const selectedYear = ref<number>(new Date().getFullYear())

  /** All years that have trade data, plus current year, newest first */
  const availableYears = computed<number[]>(() => {
    const years = new Set<number>([new Date().getFullYear()])
    for (const e of allEvents.value) {
      years.add(parseInt(e.date.slice(0, 4), 10))
    }
    return [...years].sort((a, b) => b - a)
  })

  /** Heatmap grid for the selected year — one entry per calendar day */
  const heatmapData = computed<HeatmapDay[]>(() =>
    buildHeatmapGridForYear(eventsByDate.value, selectedYear.value),
  )

  /** Aggregate stats for the selected year */
  const yearStats = computed(() => {
    const year = selectedYear.value
    let trades = 0
    let buyValue = 0
    let sellValue = 0
    let activeDays = 0
    for (const [date, events] of Object.entries(eventsByDate.value)) {
      if (parseInt(date.slice(0, 4), 10) !== year) continue
      activeDays++
      for (const e of events) {
        trades++
        if (e.type === 'BUY') buyValue += e.value
        else sellValue += e.value
      }
    }
    return { trades, buyValue, sellValue, activeDays }
  })

  /** Currently selected date (null = nothing selected) */
  const selectedDate = ref<string | null>(null)

  /** Events for the selected date */
  const selectedDateEvents = computed<TradeEvent[]>(() => {
    if (!selectedDate.value) return []
    return eventsByDate.value[selectedDate.value] ?? []
  })

  function selectDate(date: string) {
    selectedDate.value = selectedDate.value === date ? null : date
  }

  function clearSelection() {
    selectedDate.value = null
  }

  return {
    allEvents,
    eventsByDate,
    heatmapData,
    selectedYear,
    availableYears,
    yearStats,
    selectedDate,
    selectedDateEvents,
    selectDate,
    clearSelection,
  }
}
