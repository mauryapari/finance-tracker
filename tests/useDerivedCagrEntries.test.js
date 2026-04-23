import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDataStore } from '../app/stores/data.js'
import { useDerivedCagrEntries } from '../app/composables/useDerivedCagrEntries.js'

beforeEach(() => {
  setActivePinia(createPinia())
  Object.defineProperty(globalThis, 'window', { value: globalThis, writable: true, configurable: true })
})

// ---------------------------------------------------------------------------
// derivedStockCagrEntries
// ---------------------------------------------------------------------------
describe('derivedStockCagrEntries', () => {
  it('returns empty array when all tables are empty', () => {
    const { derivedStockCagrEntries } = useDerivedCagrEntries()
    expect(derivedStockCagrEntries.value).toEqual([])
  })

  it('produces an Investment entry from openPositions', () => {
    const store = useDataStore()
    store.tables.openPositions = [{ id: '1', buyDate: '2024-01-15', buyPrice: 100, qty: 10 }]
    const { derivedStockCagrEntries } = useDerivedCagrEntries()
    const entries = derivedStockCagrEntries.value
    expect(entries).toHaveLength(1)
    expect(entries[0].investmentOrOut).toBe('Investment')
    expect(entries[0].amount).toBe(1000)
    expect(entries[0].date).toBe('2024-01-15')
  })

  it('merges two openPositions on the same buyDate', () => {
    const store = useDataStore()
    store.tables.openPositions = [
      { id: '1', buyDate: '2024-03-01', buyPrice: 100, qty: 5 },
      { id: '2', buyDate: '2024-03-01', buyPrice: 200, qty: 3 },
    ]
    const { derivedStockCagrEntries } = useDerivedCagrEntries()
    const entries = derivedStockCagrEntries.value
    expect(entries).toHaveLength(1)
    expect(entries[0].amount).toBe(1100) // 500 + 600
  })

  it('produces an Out entry from closedPositions', () => {
    const store = useDataStore()
    store.tables.closedPositions = [
      { id: 'c1', buyDate: '2023-01-01', buyRate: 100, qty: 5, sellDate: '2024-06-01', sellPrice: 150 },
    ]
    const { derivedStockCagrEntries } = useDerivedCagrEntries()
    const entries = derivedStockCagrEntries.value
    const outEntry = entries.find(e => e.investmentOrOut === 'Out')
    expect(outEntry).toBeTruthy()
    expect(outEntry.amount).toBe(750) // 150*5
    expect(outEntry.date).toBe('2024-06-01')
  })

  it('includes ETF investments in the stock entries', () => {
    const store = useDataStore()
    store.tables.etfs = [{ id: 'e1', buyDate: '2024-02-10', buyPrice: 200, qty: 2 }]
    const { derivedStockCagrEntries } = useDerivedCagrEntries()
    const entries = derivedStockCagrEntries.value
    expect(entries).toHaveLength(1)
    expect(entries[0].amount).toBe(400)
  })

  it('skips rows with missing buyDate', () => {
    const store = useDataStore()
    store.tables.openPositions = [
      { id: '1', buyDate: '', buyPrice: 100, qty: 5 },
      { id: '2', buyDate: '2024-01-01', buyPrice: 50, qty: 4 },
    ]
    const { derivedStockCagrEntries } = useDerivedCagrEntries()
    expect(derivedStockCagrEntries.value).toHaveLength(1)
  })

  it('skips rows with zero amount', () => {
    const store = useDataStore()
    store.tables.openPositions = [{ id: '1', buyDate: '2024-01-01', buyPrice: 0, qty: 5 }]
    const { derivedStockCagrEntries } = useDerivedCagrEntries()
    expect(derivedStockCagrEntries.value).toHaveLength(0)
  })

  it('returns entries sorted by date ascending', () => {
    const store = useDataStore()
    store.tables.openPositions = [
      { id: '1', buyDate: '2024-06-01', buyPrice: 100, qty: 1 },
      { id: '2', buyDate: '2023-01-01', buyPrice: 100, qty: 1 },
    ]
    const { derivedStockCagrEntries } = useDerivedCagrEntries()
    const dates = derivedStockCagrEntries.value.map(e => e.date)
    expect(dates).toEqual(['2023-01-01', '2024-06-01'])
  })

  it('id has "derived-" prefix', () => {
    const store = useDataStore()
    store.tables.openPositions = [{ id: '1', buyDate: '2024-01-01', buyPrice: 100, qty: 1 }]
    const { derivedStockCagrEntries } = useDerivedCagrEntries()
    expect(derivedStockCagrEntries.value[0].id).toMatch(/^derived-/)
  })

  it('is reactive — updates when store changes', () => {
    const store = useDataStore()
    const { derivedStockCagrEntries } = useDerivedCagrEntries()
    expect(derivedStockCagrEntries.value).toHaveLength(0)
    store.tables.openPositions = [{ id: '1', buyDate: '2024-01-01', buyPrice: 100, qty: 1 }]
    expect(derivedStockCagrEntries.value).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// derivedCommodityCagrEntries
// ---------------------------------------------------------------------------
describe('derivedCommodityCagrEntries', () => {
  it('returns empty array when all tables are empty', () => {
    const { derivedCommodityCagrEntries } = useDerivedCagrEntries()
    expect(derivedCommodityCagrEntries.value).toEqual([])
  })

  it('produces Investment entries from commodityEtfs', () => {
    const store = useDataStore()
    store.tables.commodityEtfs = [{ id: 'g1', buyDate: '2024-05-01', buyPrice: 60, qty: 10 }]
    const { derivedCommodityCagrEntries } = useDerivedCagrEntries()
    const entries = derivedCommodityCagrEntries.value
    expect(entries).toHaveLength(1)
    expect(entries[0].amount).toBe(600)
    expect(entries[0].investmentOrOut).toBe('Investment')
  })

  it('does NOT include stock positions in commodity entries', () => {
    const store = useDataStore()
    store.tables.openPositions = [{ id: '1', buyDate: '2024-01-01', buyPrice: 100, qty: 5 }]
    const { derivedCommodityCagrEntries } = useDerivedCagrEntries()
    expect(derivedCommodityCagrEntries.value).toHaveLength(0)
  })

  it('produces Out entries from closedCommodityEtfs', () => {
    const store = useDataStore()
    store.tables.closedCommodityEtfs = [
      { id: 'cg1', buyDate: '2023-01-01', buyRate: 50, qty: 5, sellDate: '2024-04-01', sellPrice: 70 },
    ]
    const { derivedCommodityCagrEntries } = useDerivedCagrEntries()
    const out = derivedCommodityCagrEntries.value.find(e => e.investmentOrOut === 'Out')
    expect(out).toBeTruthy()
    expect(out.amount).toBe(350)
  })

  it('merges same-date entries across tables', () => {
    const store = useDataStore()
    store.tables.commodityEtfs = [{ id: '1', buyDate: '2024-01-01', buyPrice: 100, qty: 2 }]
    store.tables.closedCommodityEtfs = [{ id: '2', buyDate: '2024-01-01', buyRate: 50, qty: 4, sellDate: '2025-01-01', sellPrice: 60 }]
    const { derivedCommodityCagrEntries } = useDerivedCagrEntries()
    const investEntries = derivedCommodityCagrEntries.value.filter(e => e.investmentOrOut === 'Investment')
    // Both on same date → merged into one
    expect(investEntries).toHaveLength(1)
    expect(investEntries[0].amount).toBe(400) // 100*2 + 50*4
  })
})
