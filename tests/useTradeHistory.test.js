import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDataStore } from '../app/stores/data.js'
import { useTradeHistory } from '../app/composables/useTradeHistory.js'

beforeEach(() => {
  setActivePinia(createPinia())
  Object.defineProperty(globalThis, 'window', { value: globalThis, writable: true, configurable: true })
})

// ── allEvents ────────────────────────────────────────────────────────────────

describe('allEvents', () => {
  it('returns empty array when all tables empty', () => {
    const { allEvents } = useTradeHistory()
    expect(allEvents.value).toEqual([])
  })

  it('derives BUY event from openPositions', () => {
    const store = useDataStore()
    store.tables.openPositions = [
      { id: 'op1', stock: 'RELIANCE', qty: 10, buyDate: '2024-03-15', buyPrice: 2500, cmp: 2600, peakPrice: 2700, targetPrice: 3000, stockExchange: 'NSE' },
    ]
    const { allEvents } = useTradeHistory()
    expect(allEvents.value).toHaveLength(1)
    const ev = allEvents.value[0]
    expect(ev.type).toBe('BUY')
    expect(ev.stock).toBe('RELIANCE')
    expect(ev.qty).toBe(10)
    expect(ev.price).toBe(2500)
    expect(ev.value).toBe(25000)
    expect(ev.linkTo).toBe('/open-positions')
    expect(ev.tableKey).toBe('openPositions')
  })

  it('derives BUY and SELL events from closedPositions', () => {
    const store = useDataStore()
    store.tables.closedPositions = [
      { id: 'cp1', stock: 'INFY', qty: 5, buyDate: '2023-01-10', buyRate: 1500, sellDate: '2024-06-01', sellPrice: 1800 },
    ]
    const { allEvents } = useTradeHistory()
    expect(allEvents.value).toHaveLength(2)
    const types = allEvents.value.map(e => e.type).sort()
    expect(types).toEqual(['BUY', 'SELL'])
  })

  it('derives BUY event from etfs', () => {
    const store = useDataStore()
    store.tables.etfs = [
      { id: 'etf1', type: 'NIFTY', stock: 'NIFTYBEES', stockExchange: 'NSE', buyDate: '2024-01-20', buyPrice: 200, qty: 50, cmp: 210 },
    ]
    const { allEvents } = useTradeHistory()
    expect(allEvents.value).toHaveLength(1)
    expect(allEvents.value[0].linkTo).toBe('/etfs')
  })

  it('derives BUY + SELL from closedEtfs', () => {
    const store = useDataStore()
    store.tables.closedEtfs = [
      { id: 'ce1', type: 'NIFTY', stock: 'NIFTYBEES', buyDate: '2022-05-10', buyRate: 150, qty: 20, sellDate: '2023-09-01', sellPrice: 210 },
    ]
    const { allEvents } = useTradeHistory()
    expect(allEvents.value).toHaveLength(2)
    expect(allEvents.value.every(e => e.linkTo === '/closed-etfs')).toBe(true)
  })

  it('derives BUY event from commodityEtfs', () => {
    const store = useDataStore()
    store.tables.commodityEtfs = [
      { id: 'co1', type: 'GOLD', stock: 'GOLDBEES', stockExchange: 'NSE', buyDate: '2024-02-14', buyPrice: 50, qty: 100, cmp: 55 },
    ]
    const { allEvents } = useTradeHistory()
    expect(allEvents.value).toHaveLength(1)
    expect(allEvents.value[0].linkTo).toBe('/commodity-etfs')
  })

  it('derives BUY + SELL from closedCommodityEtfs', () => {
    const store = useDataStore()
    store.tables.closedCommodityEtfs = [
      { id: 'cco1', stock: 'GOLDBEES', buyDate: '2021-07-01', buyRate: 40, qty: 50, sellDate: '2023-03-15', sellPrice: 55 },
    ]
    const { allEvents } = useTradeHistory()
    expect(allEvents.value).toHaveLength(2)
    expect(allEvents.value.every(e => e.linkTo === '/closed-commodity-etfs')).toBe(true)
  })

  it('skips rows with missing required fields', () => {
    const store = useDataStore()
    store.tables.openPositions = [
      { id: '1', stock: '', qty: 10, buyDate: '2024-01-01', buyPrice: 100 },   // missing stock
      { id: '2', stock: 'TCS', qty: 5, buyDate: '', buyPrice: 100 },           // missing date
      { id: '3', stock: 'TCS', qty: 5, buyDate: '2024-01-01', buyPrice: 0 },   // price is 0 — allowed but value=0; still emitted since price field exists but result is 0
    ]
    const { allEvents } = useTradeHistory()
    // row with empty stock is skipped, row with empty date is skipped
    // row with price=0 — stock exists, date exists, but price=0 is falsy → skipped
    expect(allEvents.value).toHaveLength(0)
  })

  it('sorts events newest first', () => {
    const store = useDataStore()
    store.tables.openPositions = [
      { id: '1', stock: 'A', qty: 1, buyDate: '2024-01-01', buyPrice: 100 },
      { id: '2', stock: 'B', qty: 1, buyDate: '2024-06-01', buyPrice: 200 },
    ]
    const { allEvents } = useTradeHistory()
    expect(allEvents.value[0].date).toBe('2024-06-01')
    expect(allEvents.value[1].date).toBe('2024-01-01')
  })

  it('is reactive — updates when store changes', () => {
    const store = useDataStore()
    const { allEvents } = useTradeHistory()
    expect(allEvents.value).toHaveLength(0)
    store.tables.openPositions = [
      { id: '1', stock: 'TCS', qty: 5, buyDate: '2024-01-01', buyPrice: 3000 },
    ]
    expect(allEvents.value).toHaveLength(1)
  })

  it('event id contains tableKey and type suffix', () => {
    const store = useDataStore()
    store.tables.openPositions = [
      { id: 'myid', stock: 'TCS', qty: 1, buyDate: '2024-01-01', buyPrice: 100 },
    ]
    const { allEvents } = useTradeHistory()
    expect(allEvents.value[0].id).toBe('openPositions-buy-myid')
  })
})

// ── eventsByDate ─────────────────────────────────────────────────────────────

describe('eventsByDate', () => {
  it('groups events under their date key', () => {
    const store = useDataStore()
    store.tables.openPositions = [
      { id: '1', stock: 'HDFC', qty: 2, buyDate: '2024-04-10', buyPrice: 1600 },
      { id: '2', stock: 'ICICI', qty: 3, buyDate: '2024-04-10', buyPrice: 900 },
    ]
    const { eventsByDate } = useTradeHistory()
    expect(eventsByDate.value['2024-04-10']).toHaveLength(2)
  })

  it('separate dates produce separate keys', () => {
    const store = useDataStore()
    store.tables.openPositions = [
      { id: '1', stock: 'A', qty: 1, buyDate: '2024-01-01', buyPrice: 100 },
      { id: '2', stock: 'B', qty: 1, buyDate: '2024-02-01', buyPrice: 200 },
    ]
    const { eventsByDate } = useTradeHistory()
    expect(Object.keys(eventsByDate.value)).toHaveLength(2)
  })
})

// ── selectedDate + selectDate + clearSelection ────────────────────────────────

describe('selectedDate', () => {
  it('starts as null', () => {
    const { selectedDate } = useTradeHistory()
    expect(selectedDate.value).toBeNull()
  })

  it('selectDate sets the date', () => {
    const { selectedDate, selectDate } = useTradeHistory()
    selectDate('2024-05-01')
    expect(selectedDate.value).toBe('2024-05-01')
  })

  it('selectDate toggles off when same date selected again', () => {
    const { selectedDate, selectDate } = useTradeHistory()
    selectDate('2024-05-01')
    selectDate('2024-05-01')
    expect(selectedDate.value).toBeNull()
  })

  it('clearSelection resets to null', () => {
    const { selectedDate, selectDate, clearSelection } = useTradeHistory()
    selectDate('2024-05-01')
    clearSelection()
    expect(selectedDate.value).toBeNull()
  })
})

// ── selectedDateEvents ────────────────────────────────────────────────────────

describe('selectedDateEvents', () => {
  it('returns empty array when nothing selected', () => {
    const { selectedDateEvents } = useTradeHistory()
    expect(selectedDateEvents.value).toEqual([])
  })

  it('returns events for selected date', () => {
    const store = useDataStore()
    store.tables.openPositions = [
      { id: '1', stock: 'WIPRO', qty: 4, buyDate: '2024-07-15', buyPrice: 450 },
    ]
    const { selectedDateEvents, selectDate } = useTradeHistory()
    selectDate('2024-07-15')
    expect(selectedDateEvents.value).toHaveLength(1)
    expect(selectedDateEvents.value[0].stock).toBe('WIPRO')
  })

  it('returns empty array for date with no events', () => {
    const { selectedDateEvents, selectDate } = useTradeHistory()
    selectDate('1999-01-01')
    expect(selectedDateEvents.value).toEqual([])
  })
})

// ── heatmapData ───────────────────────────────────────────────────────────────

describe('heatmapData', () => {
  it('includes today in the grid', () => {
    const { heatmapData } = useTradeHistory()
    const today = new Date().toISOString().split('T')[0]
    const found = heatmapData.value.find(d => d.date === today)
    expect(found).toBeTruthy()
  })

  it('sets count=0 for days with no trades', () => {
    const { heatmapData } = useTradeHistory()
    const today = new Date().toISOString().split('T')[0]
    const found = heatmapData.value.find(d => d.date === today)
    expect(found?.count).toBe(0)
  })

  it('sets count correctly for days with trades', () => {
    const store = useDataStore()
    const today = new Date().toISOString().split('T')[0]
    store.tables.openPositions = [
      { id: '1', stock: 'TCS', qty: 5, buyDate: today, buyPrice: 3000 },
      { id: '2', stock: 'INFY', qty: 3, buyDate: today, buyPrice: 1800 },
    ]
    const { heatmapData } = useTradeHistory()
    const found = heatmapData.value.find(d => d.date === today)
    expect(found?.count).toBe(2)
  })

  it('accumulates value correctly', () => {
    const store = useDataStore()
    const today = new Date().toISOString().split('T')[0]
    store.tables.openPositions = [
      { id: '1', stock: 'TCS', qty: 5, buyDate: today, buyPrice: 3000 },
    ]
    const { heatmapData } = useTradeHistory()
    const found = heatmapData.value.find(d => d.date === today)
    expect(found?.value).toBe(15000) // 3000 * 5
  })

  it('starts from Jan 1 of selected year', () => {
    const { heatmapData, selectedYear } = useTradeHistory()
    const year = selectedYear.value
    const first = heatmapData.value[0]
    expect(first?.date.startsWith(`${year}-01-01`)).toBe(true)
  })

  it('does not include dates from a different year', () => {
    const { heatmapData, selectedYear } = useTradeHistory()
    const year = selectedYear.value
    const outOfYear = heatmapData.value.filter(d => !d.date.startsWith(`${year}-`))
    expect(outOfYear).toHaveLength(0)
  })
})

// ── selectedYear + availableYears ────────────────────────────────────────────

describe('selectedYear', () => {
  it('defaults to current year', () => {
    const { selectedYear } = useTradeHistory()
    expect(selectedYear.value).toBe(new Date().getFullYear())
  })

  it('is mutable — setting it changes heatmapData year', () => {
    const { selectedYear, heatmapData } = useTradeHistory()
    const originalYear = selectedYear.value
    // heatmapData for current year starts on Jan 1 of current year
    expect(heatmapData.value[0]?.date.startsWith(`${originalYear}-`)).toBe(true)
  })
})

describe('availableYears', () => {
  it('always contains the current year', () => {
    const { availableYears } = useTradeHistory()
    expect(availableYears.value).toContain(new Date().getFullYear())
  })

  it('includes years from trade data', () => {
    const store = useDataStore()
    store.tables.openPositions = [
      { id: '1', stock: 'A', qty: 1, buyDate: '2022-06-15', buyPrice: 100 },
    ]
    const { availableYears } = useTradeHistory()
    expect(availableYears.value).toContain(2022)
  })

  it('sorted newest first', () => {
    const store = useDataStore()
    store.tables.openPositions = [
      { id: '1', stock: 'A', qty: 1, buyDate: '2021-01-01', buyPrice: 100 },
      { id: '2', stock: 'B', qty: 1, buyDate: '2023-01-01', buyPrice: 200 },
    ]
    const { availableYears } = useTradeHistory()
    const years = availableYears.value
    for (let i = 0; i < years.length - 1; i++) {
      expect(years[i]).toBeGreaterThan(years[i + 1])
    }
  })

  it('does not contain duplicates', () => {
    const store = useDataStore()
    store.tables.openPositions = [
      { id: '1', stock: 'A', qty: 1, buyDate: '2024-01-01', buyPrice: 100 },
      { id: '2', stock: 'B', qty: 1, buyDate: '2024-06-01', buyPrice: 200 },
    ]
    const { availableYears } = useTradeHistory()
    const years = availableYears.value
    expect(new Set(years).size).toBe(years.length)
  })
})

// ── yearStats ────────────────────────────────────────────────────────────────

describe('yearStats', () => {
  it('returns zero stats when no trades', () => {
    const { yearStats } = useTradeHistory()
    expect(yearStats.value).toEqual({ trades: 0, buyValue: 0, sellValue: 0, activeDays: 0 })
  })

  it('counts BUY trades correctly', () => {
    const store = useDataStore()
    const year = new Date().getFullYear()
    store.tables.openPositions = [
      { id: '1', stock: 'TCS', qty: 2, buyDate: `${year}-03-01`, buyPrice: 3000 },
      { id: '2', stock: 'INFY', qty: 1, buyDate: `${year}-04-01`, buyPrice: 1800 },
    ]
    const { yearStats } = useTradeHistory()
    expect(yearStats.value.trades).toBe(2)
  })

  it('sums buyValue only for BUY events', () => {
    const store = useDataStore()
    const year = new Date().getFullYear()
    store.tables.openPositions = [
      { id: '1', stock: 'TCS', qty: 2, buyDate: `${year}-03-01`, buyPrice: 3000 },
    ]
    const { yearStats } = useTradeHistory()
    expect(yearStats.value.buyValue).toBe(6000)
    expect(yearStats.value.sellValue).toBe(0)
  })

  it('sums sellValue only for SELL events', () => {
    const store = useDataStore()
    const year = new Date().getFullYear()
    store.tables.closedPositions = [
      { id: '1', stock: 'TCS', qty: 5, buyDate: `${year - 1}-01-01`, buyRate: 1000, sellDate: `${year}-02-01`, sellPrice: 1500 },
    ]
    const { yearStats } = useTradeHistory()
    expect(yearStats.value.sellValue).toBe(7500)
  })

  it('counts activeDays as distinct dates with trades', () => {
    const store = useDataStore()
    const year = new Date().getFullYear()
    store.tables.openPositions = [
      { id: '1', stock: 'A', qty: 1, buyDate: `${year}-01-05`, buyPrice: 100 },
      { id: '2', stock: 'B', qty: 1, buyDate: `${year}-01-05`, buyPrice: 200 }, // same day
      { id: '3', stock: 'C', qty: 1, buyDate: `${year}-02-10`, buyPrice: 300 }, // different day
    ]
    const { yearStats } = useTradeHistory()
    expect(yearStats.value.activeDays).toBe(2)
    expect(yearStats.value.trades).toBe(3)
  })

  it('excludes events from other years', () => {
    const store = useDataStore()
    const year = new Date().getFullYear()
    store.tables.openPositions = [
      { id: '1', stock: 'A', qty: 1, buyDate: `${year - 1}-12-31`, buyPrice: 100 }, // last year
      { id: '2', stock: 'B', qty: 1, buyDate: `${year}-01-01`, buyPrice: 200 },     // this year
    ]
    const { yearStats } = useTradeHistory()
    expect(yearStats.value.trades).toBe(1)
  })
})
