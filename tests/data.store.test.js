import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDataStore } from '../app/stores/data.js'

// Minimal localStorage mock
function makeLocalStorage() {
  let store = {}
  return {
    getItem: vi.fn(k => store[k] ?? null),
    setItem: vi.fn((k, v) => { store[k] = v }),
    removeItem: vi.fn(k => { delete store[k] }),
    clear: vi.fn(() => { store = {} }),
  }
}

function mockFetch(response) {
  return vi.fn().mockResolvedValue({ json: () => Promise.resolve(response) })
}

beforeEach(() => {
  setActivePinia(createPinia())
  const ls = makeLocalStorage()
  Object.defineProperty(globalThis, 'localStorage', { value: ls, writable: true, configurable: true })
  Object.defineProperty(globalThis, 'window', { value: globalThis, writable: true, configurable: true })
  // Default: Redis not configured — all existing tests use localStorage path
  vi.stubGlobal('fetch', mockFetch({ configured: false }))
  vi.stubGlobal('useRuntimeConfig', () => ({ public: { storageKey: 'finance_tracker_data' } }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------
describe('initial state', () => {
  it('starts with all ten empty tables', () => {
    const store = useDataStore()
    const keys = ['openPositions', 'closedPositions', 'etfs', 'closedEtfs',
      'commodityEtfs', 'closedCommodityEtfs', 'cagrEntries', 'commodityCagrEntries',
      'budgetYears', 'budgetMonthly']
    for (const k of keys) expect(store.tables[k]).toEqual([])
  })

  it('has version 2', () => {
    expect(useDataStore().version).toBe(2)
  })

  it('defaults storageMode to local', () => {
    expect(useDataStore().storageMode).toBe('local')
  })
})

// ---------------------------------------------------------------------------
// addRow / updateRow / deleteRow
// ---------------------------------------------------------------------------
describe('addRow', () => {
  it('appends a row and persists to storage', () => {
    const store = useDataStore()
    store.addRow('openPositions', { stock: 'RELIANCE', qty: 10, buyPrice: 100 })
    expect(store.tables.openPositions).toHaveLength(1)
    expect(store.tables.openPositions[0].stock).toBe('RELIANCE')
    expect(store.tables.openPositions[0].id).toBeTruthy()
    expect(localStorage.setItem).toHaveBeenCalled()
  })

  it('preserves a provided id', () => {
    const store = useDataStore()
    store.addRow('etfs', { id: 'fixed-id', name: 'Nifty 50' })
    expect(store.tables.etfs[0].id).toBe('fixed-id')
  })

  it('generates unique ids for two rows', () => {
    const store = useDataStore()
    store.addRow('openPositions', { stock: 'A' })
    store.addRow('openPositions', { stock: 'B' })
    const [a, b] = store.tables.openPositions
    expect(a.id).not.toBe(b.id)
  })
})

describe('updateRow', () => {
  it('updates the matching row in-place', () => {
    const store = useDataStore()
    store.addRow('openPositions', { id: 'r1', stock: 'TCS', qty: 5 })
    store.updateRow('openPositions', 'r1', { stock: 'TCS', qty: 10 })
    expect(store.tables.openPositions[0].qty).toBe(10)
    expect(store.tables.openPositions[0].id).toBe('r1')
  })

  it('does nothing for an unknown id', () => {
    const store = useDataStore()
    store.addRow('openPositions', { id: 'r1', stock: 'TCS', qty: 5 })
    store.updateRow('openPositions', 'no-such-id', { stock: 'INFY' })
    expect(store.tables.openPositions).toHaveLength(1)
    expect(store.tables.openPositions[0].stock).toBe('TCS')
  })
})

describe('deleteRow', () => {
  it('removes the row by id', () => {
    const store = useDataStore()
    store.addRow('openPositions', { id: 'r1', stock: 'TCS' })
    store.addRow('openPositions', { id: 'r2', stock: 'INFY' })
    store.deleteRow('openPositions', 'r1')
    expect(store.tables.openPositions).toHaveLength(1)
    expect(store.tables.openPositions[0].id).toBe('r2')
  })

  it('is a no-op for unknown id', () => {
    const store = useDataStore()
    store.addRow('openPositions', { id: 'r1', stock: 'TCS' })
    store.deleteRow('openPositions', 'ghost')
    expect(store.tables.openPositions).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// updateCmp — transient, must NOT persist
// ---------------------------------------------------------------------------
describe('updateCmp', () => {
  it('updates cmp in memory', () => {
    const store = useDataStore()
    store.addRow('openPositions', { id: 'r1', stock: 'TCS', cmp: 100 })
    localStorage.setItem.mockClear()
    store.updateCmp('openPositions', 'r1', 250)
    expect(store.tables.openPositions[0].cmp).toBe(250)
  })

  it('does NOT call saveToStorage when CMP is below peakPrice', () => {
    const store = useDataStore()
    store.addRow('openPositions', { id: 'r1', stock: 'TCS', cmp: 100, peakPrice: 500 })
    localStorage.setItem.mockClear()
    store.updateCmp('openPositions', 'r1', 300) // 300 < 500 → no peak update, no save
    expect(localStorage.setItem).not.toHaveBeenCalled()
  })

  it('DOES call saveToStorage when CMP exceeds peakPrice', () => {
    const store = useDataStore()
    store.addRow('openPositions', { id: 'r1', stock: 'TCS', cmp: 100, peakPrice: 200 })
    localStorage.setItem.mockClear()
    store.updateCmp('openPositions', 'r1', 300) // 300 > 200 → peak updated, saved
    expect(localStorage.setItem).toHaveBeenCalled()
    expect(store.tables.openPositions[0].peakPrice).toBe(300)
  })
})

// ---------------------------------------------------------------------------
// loadFromStorage — local mode (Redis not configured)
// ---------------------------------------------------------------------------
describe('loadFromStorage — local mode', () => {
  it('restores previously saved data', async () => {
    const store = useDataStore()
    store.addRow('openPositions', { id: 'r1', stock: 'TCS', qty: 5 })

    setActivePinia(createPinia())
    const store2 = useDataStore()
    await store2.loadFromStorage()
    expect(store2.tables.openPositions).toHaveLength(1)
    expect(store2.tables.openPositions[0].stock).toBe('TCS')
  })

  it('sets storageMode to local', async () => {
    const store = useDataStore()
    await store.loadFromStorage()
    expect(store.storageMode).toBe('local')
  })

  it('backfills missing table keys from old data', async () => {
    localStorage.setItem('finance_tracker_data', JSON.stringify({
      version: 1,
      tables: { openPositions: [{ id: 'x', stock: 'OLD' }] }
    }))
    const store = useDataStore()
    await store.loadFromStorage()
    expect(store.tables.closedPositions).toEqual([])
    expect(store.tables.cagrEntries).toEqual([])
  })

  it('is a no-op when localStorage is empty', async () => {
    localStorage.getItem.mockReturnValue(null)
    const store = useDataStore()
    await store.loadFromStorage()
    expect(store.tables.openPositions).toEqual([])
  })

  it('handles corrupt JSON without throwing', async () => {
    localStorage.setItem('finance_tracker_data', 'not-valid-json')
    const store = useDataStore()
    await expect(store.loadFromStorage()).resolves.not.toThrow()
  })

  it('falls back to localStorage when /api/data fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    localStorage.setItem('finance_tracker_data', JSON.stringify({
      version: 2,
      tables: { openPositions: [{ id: 'r1', stock: 'TCS' }], closedPositions: [],
        etfs: [], closedEtfs: [], commodityEtfs: [], closedCommodityEtfs: [],
        cagrEntries: [], commodityCagrEntries: [], budgetYears: [], budgetMonthly: [] }
    }))
    const store = useDataStore()
    await store.loadFromStorage()
    expect(store.storageMode).toBe('local')
    expect(store.tables.openPositions[0].stock).toBe('TCS')
  })
})

// ---------------------------------------------------------------------------
// loadFromStorage — remote mode (Redis configured)
// ---------------------------------------------------------------------------
describe('loadFromStorage — remote mode', () => {
  it('loads data from Redis when configured', async () => {
    vi.stubGlobal('fetch', mockFetch({
      configured: true,
      data: {
        version: 2,
        tables: {
          openPositions: [{ id: 'r1', stock: 'INFY' }],
          closedPositions: [], etfs: [], closedEtfs: [],
          commodityEtfs: [], closedCommodityEtfs: [],
          cagrEntries: [], commodityCagrEntries: [],
          budgetYears: [], budgetMonthly: [],
        }
      }
    }))
    const store = useDataStore()
    await store.loadFromStorage()
    expect(store.storageMode).toBe('remote')
    expect(store.tables.openPositions[0].stock).toBe('INFY')
  })

  it('backfills missing table keys from Redis data', async () => {
    vi.stubGlobal('fetch', mockFetch({
      configured: true,
      data: { version: 2, tables: { openPositions: [{ id: 'r1', stock: 'TCS' }] } }
    }))
    const store = useDataStore()
    await store.loadFromStorage()
    expect(store.tables.closedPositions).toEqual([])
  })

  it('migrates localStorage to Redis when Redis is empty', async () => {
    const postMock = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ ok: true }) })
    let callCount = 0
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url, opts) => {
      if (!opts || opts.method !== 'POST') {
        // First GET call returns empty Redis
        if (callCount === 0) {
          callCount++
          return Promise.resolve({ json: () => Promise.resolve({ configured: true, data: null }) })
        }
      }
      // POST call (migration save)
      return postMock(url, opts)
    }))
    localStorage.setItem('finance_tracker_data', JSON.stringify({
      version: 2,
      tables: {
        openPositions: [{ id: 'r1', stock: 'TCS' }],
        closedPositions: [], etfs: [], closedEtfs: [],
        commodityEtfs: [], closedCommodityEtfs: [],
        cagrEntries: [], commodityCagrEntries: [],
        budgetYears: [], budgetMonthly: [],
      }
    }))
    const store = useDataStore()
    await store.loadFromStorage()
    expect(store.storageMode).toBe('remote')
    expect(store.tables.openPositions[0].stock).toBe('TCS')
    expect(postMock).toHaveBeenCalled()
    expect(localStorage.removeItem).toHaveBeenCalledWith('finance_tracker_data')
  })

  it('starts with empty store when Redis is empty and localStorage has no data', async () => {
    vi.stubGlobal('fetch', mockFetch({ configured: true, data: null }))
    const store = useDataStore()
    await store.loadFromStorage()
    expect(store.storageMode).toBe('remote')
    expect(store.tables.openPositions).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// saveToStorage — remote mode
// ---------------------------------------------------------------------------
describe('saveToStorage — remote mode', () => {
  it('calls POST /api/data instead of localStorage when storageMode is remote', async () => {
    const postMock = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ ok: true }) })
    vi.stubGlobal('fetch', postMock)
    const store = useDataStore()
    store.storageMode = 'remote'
    localStorage.setItem.mockClear()
    await store.saveToStorage()
    expect(postMock).toHaveBeenCalledWith('/api/data', expect.objectContaining({ method: 'POST' }))
    expect(localStorage.setItem).not.toHaveBeenCalled()
  })

  it('still uses localStorage when storageMode is local', () => {
    const store = useDataStore()
    store.storageMode = 'local'
    store.saveToStorage()
    expect(localStorage.setItem).toHaveBeenCalledWith('finance_tracker_data', expect.any(String))
  })
})

// ---------------------------------------------------------------------------
// importAll
// ---------------------------------------------------------------------------
describe('importAll', () => {
  it('replaces store state and persists', () => {
    const store = useDataStore()
    store.addRow('openPositions', { stock: 'OLD' })

    store.importAll({
      version: 1,
      tables: {
        openPositions: [{ id: 'new1', stock: 'NEW' }],
        closedPositions: [], etfs: [], closedEtfs: [],
        commodityEtfs: [], closedCommodityEtfs: [],
        cagrEntries: [], commodityCagrEntries: [],
      }
    })

    expect(store.tables.openPositions).toHaveLength(1)
    expect(store.tables.openPositions[0].stock).toBe('NEW')
    expect(localStorage.setItem).toHaveBeenCalled()
  })

  it('throws on invalid format', () => {
    const store = useDataStore()
    expect(() => store.importAll({ wrong: true })).toThrow('Invalid data format')
  })

  it('backfills missing table keys in import payload', () => {
    const store = useDataStore()
    store.importAll({ version: 1, tables: { openPositions: [] } })
    expect(store.tables.cagrEntries).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// stockSummary getter
// ---------------------------------------------------------------------------
describe('stockSummary getter', () => {
  it('returns zeros when table is empty', () => {
    const store = useDataStore()
    expect(store.stockSummary).toMatchObject({ netValue: 0, totalInvested: 0, profit: 0, profitPercentage: 0 })
  })

  it('calculates summary for multiple positions', () => {
    const store = useDataStore()
    store.tables.openPositions = [
      { buyPrice: 100, qty: 10, cmp: 150 },
      { buyPrice: 200, qty: 5,  cmp: 200 },
    ]
    const s = store.stockSummary
    expect(s.totalInvested).toBe(2000)
    expect(s.netValue).toBe(2500)
    expect(s.profit).toBe(500)
    expect(s.profitPercentage).toBe(25)
  })

  it('returns profitPercentage 0 when nothing invested', () => {
    const store = useDataStore()
    store.tables.openPositions = [{ buyPrice: 0, qty: 5, cmp: 100 }]
    expect(store.stockSummary.profitPercentage).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// commoditySummary getter
// ---------------------------------------------------------------------------
describe('commoditySummary getter', () => {
  it('returns zeros when table is empty', () => {
    const store = useDataStore()
    expect(store.commoditySummary).toMatchObject({ netValue: 0, totalInvested: 0, profit: 0, profitPercentage: 0 })
  })

  it('calculates summary for commodity positions', () => {
    const store = useDataStore()
    store.tables.commodityEtfs = [{ buyPrice: 500, qty: 4, cmp: 600 }]
    const s = store.commoditySummary
    expect(s.totalInvested).toBe(2000)
    expect(s.netValue).toBe(2400)
    expect(s.profit).toBe(400)
    expect(s.profitPercentage).toBe(20)
  })
})
