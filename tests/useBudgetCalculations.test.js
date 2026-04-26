import { describe, it, expect } from 'vitest'
import {
  calcStockEquityEtfsBreakdown,
  calcStockEquityEtfs,
  calcCommodityGold,
  calcCommoditySilver,
  calcStockProfitBooked,
  calcBrokerRunningBalance,
  calcBrokerBalanceHistory,
} from '../app/composables/useBudgetCalculations.js'

function makeStore(overrides = {}) {
  return {
    tables: {
      openPositions: [],
      closedPositions: [],
      etfs: [],
      closedEtfs: [],
      commodityEtfs: [],
      closedCommodityEtfs: [],
      ...overrides,
    },
  }
}

// ---------------------------------------------------------------------------
// calcStockEquityEtfsBreakdown
// ---------------------------------------------------------------------------
describe('calcStockEquityEtfsBreakdown', () => {
  it('returns zeros for empty tables', () => {
    const result = calcStockEquityEtfsBreakdown(makeStore(), 2025, 1)
    expect(result).toEqual({ openPositions: 0, closedPositions: 0, etfs: 0 })
  })

  it('sums openPositions buys in the target month', () => {
    const store = makeStore({
      openPositions: [
        { buyDate: '2025-01-15', buyPrice: 100, qty: 5 },
        { buyDate: '2025-02-01', buyPrice: 200, qty: 3 }, // wrong month
      ],
    })
    const result = calcStockEquityEtfsBreakdown(store, 2025, 1)
    expect(result.openPositions).toBe(500) // 100*5
    expect(result.closedPositions).toBe(0)
    expect(result.etfs).toBe(0)
  })

  it('sums closedPositions using buyRate field', () => {
    const store = makeStore({
      closedPositions: [
        { buyDate: '2025-03-10', buyRate: 200, qty: 4 },
      ],
    })
    const result = calcStockEquityEtfsBreakdown(store, 2025, 3)
    expect(result.closedPositions).toBe(800) // 200*4
  })

  it('sums etfs buys in the target month', () => {
    const store = makeStore({
      etfs: [
        { buyDate: '2025-06-05', buyPrice: 150, qty: 10 },
      ],
    })
    const result = calcStockEquityEtfsBreakdown(store, 2025, 6)
    expect(result.etfs).toBe(1500) // 150*10
  })

  it('combines all three sources', () => {
    const store = makeStore({
      openPositions:  [{ buyDate: '2025-04-01', buyPrice: 100, qty: 2 }],
      closedPositions:[{ buyDate: '2025-04-15', buyRate: 200, qty: 3 }],
      etfs:           [{ buyDate: '2025-04-20', buyPrice: 50,  qty: 4 }],
    })
    const result = calcStockEquityEtfsBreakdown(store, 2025, 4)
    expect(result.openPositions).toBe(200)
    expect(result.closedPositions).toBe(600)
    expect(result.etfs).toBe(200)
  })

  it('excludes rows from other months', () => {
    const store = makeStore({
      openPositions: [
        { buyDate: '2025-01-01', buyPrice: 100, qty: 5 },
        { buyDate: '2025-02-01', buyPrice: 100, qty: 5 },
      ],
    })
    expect(calcStockEquityEtfsBreakdown(store, 2025, 1).openPositions).toBe(500)
    expect(calcStockEquityEtfsBreakdown(store, 2025, 2).openPositions).toBe(500)
    expect(calcStockEquityEtfsBreakdown(store, 2025, 3).openPositions).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// calcStockEquityEtfs
// ---------------------------------------------------------------------------
describe('calcStockEquityEtfs', () => {
  it('returns 0 for empty store', () => {
    expect(calcStockEquityEtfs(makeStore(), 2025, 1)).toBe(0)
  })

  it('sums all three breakdown components', () => {
    const store = makeStore({
      openPositions:  [{ buyDate: '2025-05-01', buyPrice: 100, qty: 2 }],
      closedPositions:[{ buyDate: '2025-05-10', buyRate: 300, qty: 1 }],
      etfs:           [{ buyDate: '2025-05-20', buyPrice: 50,  qty: 2 }],
    })
    expect(calcStockEquityEtfs(store, 2025, 5)).toBe(600) // 200+300+100
  })
})

// ---------------------------------------------------------------------------
// calcCommodityGold
// ---------------------------------------------------------------------------
describe('calcCommodityGold', () => {
  it('returns 0 for empty tables', () => {
    expect(calcCommodityGold(makeStore(), 2025, 1)).toBe(0)
  })

  it('sums open gold commodity ETFs in the target month', () => {
    const store = makeStore({
      commodityEtfs: [
        { buyDate: '2025-02-01', buyPrice: 500, qty: 2, type: 'Gold ETF' },
        { buyDate: '2025-02-01', buyPrice: 300, qty: 1, type: 'Silver ETF' }, // excluded
      ],
    })
    expect(calcCommodityGold(store, 2025, 2)).toBe(1000) // 500*2
  })

  it('includes closed gold commodity ETFs using buyRate', () => {
    const store = makeStore({
      closedCommodityEtfs: [
        { buyDate: '2025-07-01', buyRate: 600, qty: 3, type: 'Gold' },
      ],
    })
    expect(calcCommodityGold(store, 2025, 7)).toBe(1800) // 600*3
  })

  it('matches type case-insensitively', () => {
    const store = makeStore({
      commodityEtfs: [
        { buyDate: '2025-01-10', buyPrice: 400, qty: 2, type: 'GOLD BEES' },
      ],
    })
    expect(calcCommodityGold(store, 2025, 1)).toBe(800)
  })
})

// ---------------------------------------------------------------------------
// calcCommoditySilver
// ---------------------------------------------------------------------------
describe('calcCommoditySilver', () => {
  it('returns 0 for empty tables', () => {
    expect(calcCommoditySilver(makeStore(), 2025, 1)).toBe(0)
  })

  it('sums open silver commodity ETFs', () => {
    const store = makeStore({
      commodityEtfs: [
        { buyDate: '2025-03-05', buyPrice: 80, qty: 5, type: 'Silver ETF' },
        { buyDate: '2025-03-05', buyPrice: 90, qty: 2, type: 'Gold ETF' }, // excluded
      ],
    })
    expect(calcCommoditySilver(store, 2025, 3)).toBe(400) // 80*5
  })

  it('includes closed silver commodity ETFs using buyRate', () => {
    const store = makeStore({
      closedCommodityEtfs: [
        { buyDate: '2025-04-01', buyRate: 100, qty: 10, type: 'SilverBees' },
      ],
    })
    expect(calcCommoditySilver(store, 2025, 4)).toBe(1000)
  })
})

// ---------------------------------------------------------------------------
// calcStockProfitBooked
// ---------------------------------------------------------------------------
describe('calcStockProfitBooked', () => {
  it('returns 0 for empty tables', () => {
    expect(calcStockProfitBooked(makeStore(), 2025, 1)).toBe(0)
  })

  it('calculates gain from closedPositions', () => {
    const store = makeStore({
      closedPositions: [
        { sellDate: '2025-05-10', sellPrice: 150, buyRate: 100, qty: 10 },
      ],
    })
    expect(calcStockProfitBooked(store, 2025, 5)).toBe(500) // (150-100)*10
  })

  it('handles a loss correctly (negative gain)', () => {
    const store = makeStore({
      closedPositions: [
        { sellDate: '2025-06-01', sellPrice: 80, buyRate: 100, qty: 5 },
      ],
    })
    expect(calcStockProfitBooked(store, 2025, 6)).toBe(-100) // (80-100)*5
  })

  it('sums gains across closedPositions, closedEtfs, closedCommodityEtfs', () => {
    const store = makeStore({
      closedPositions:    [{ sellDate: '2025-08-01', sellPrice: 200, buyRate: 100, qty: 2 }],
      closedEtfs:         [{ sellDate: '2025-08-15', sellPrice: 300, buyRate: 250, qty: 1 }],
      closedCommodityEtfs:[{ sellDate: '2025-08-20', sellPrice: 500, buyRate: 400, qty: 3 }],
    })
    // (200-100)*2 + (300-250)*1 + (500-400)*3 = 200+50+300 = 550
    expect(calcStockProfitBooked(store, 2025, 8)).toBe(550)
  })

  it('filters by sellDate month, not buyDate', () => {
    const store = makeStore({
      closedPositions: [
        { buyDate: '2025-01-01', sellDate: '2025-09-10', sellPrice: 200, buyRate: 100, qty: 1 },
      ],
    })
    expect(calcStockProfitBooked(store, 2025, 1)).toBe(0) // not sold in Jan
    expect(calcStockProfitBooked(store, 2025, 9)).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// calcBrokerRunningBalance
// ---------------------------------------------------------------------------
describe('calcBrokerRunningBalance', () => {
  it('returns array of 12 zeros for empty store', () => {
    const result = calcBrokerRunningBalance(makeStore(), 2025)
    expect(result).toHaveLength(12)
    for (const entry of result) {
      expect(entry.freshStockEquityEtfs).toBe(0)
      expect(entry.freshCommodities).toBe(0)
      expect(entry.sellProceeds).toBe(0)
      expect(entry.brokerBalance).toBe(0)
    }
  })

  it('returns array of 12 zeros when all activity is after targetYear', () => {
    const store = makeStore({
      openPositions: [{ buyDate: '2026-01-01', buyPrice: 100, qty: 1 }],
    })
    const result = calcBrokerRunningBalance(store, 2025)
    expect(result).toHaveLength(12)
    expect(result.every(e => e.freshStockEquityEtfs === 0)).toBe(true)
  })

  it('treats all buys as fresh when broker balance is zero (no prior sells)', () => {
    const store = makeStore({
      openPositions: [
        { buyDate: '2025-03-10', buyPrice: 1000, qty: 1 },
      ],
    })
    const result = calcBrokerRunningBalance(store, 2025)
    // March is index 2
    expect(result[2].freshStockEquityEtfs).toBe(1000)
    expect(result[2].brokerBalance).toBe(0)
    // Other months are zero
    expect(result[0].freshStockEquityEtfs).toBe(0)
  })

  it('sell proceeds in one month reduce fresh investment in the next', () => {
    const store = makeStore({
      closedPositions: [
        // Sell in Jan: 500 proceeds hit broker balance
        { buyDate: '2024-06-01', buyRate: 300, sellDate: '2025-01-15', sellPrice: 500, qty: 1 },
        // Buy in Feb with 1000 total: broker covers 500, fresh = 500
        { buyDate: '2025-02-10', buyRate: 1000, sellDate: '2026-01-01', sellPrice: 1200, qty: 1 },
      ],
    })
    const result = calcBrokerRunningBalance(store, 2025)
    // Jan: sell 500 → balance=500, no buys → fresh=0, balance stays 500
    expect(result[0].sellProceeds).toBe(500)
    expect(result[0].brokerBalance).toBe(500)
    // Feb: buy 1000, broker has 500 → recycled=500, fresh=500
    expect(result[1].freshStockEquityEtfs).toBe(500)
    expect(result[1].brokerBalance).toBe(0)
  })

  it('splits recycled proportionally between stocks and commodities', () => {
    // 500 in broker cash (sell 1 share @ 500). Buy 500 stocks + 500 commodities = 1000 total.
    // Recycled = min(500, 1000) = 500. Stock share = 500*(500/1000) = 250.
    // Fresh stocks = 500-250 = 250. Fresh commodities = 500-250 = 250.
    const store = makeStore({
      closedPositions: [
        { buyDate: '2024-01-01', buyRate: 100, sellDate: '2025-01-01', sellPrice: 500, qty: 1 },
      ],
      openPositions:   [{ buyDate: '2025-02-01', buyPrice: 500, qty: 1 }],
      commodityEtfs:   [{ buyDate: '2025-02-01', buyPrice: 500, qty: 1, type: 'Gold' }],
    })
    const result = calcBrokerRunningBalance(store, 2025)
    expect(result[1].freshStockEquityEtfs).toBeCloseTo(250)
    expect(result[1].freshCommodities).toBeCloseTo(250)
  })
})

// ---------------------------------------------------------------------------
// calcBrokerBalanceHistory
// ---------------------------------------------------------------------------
describe('calcBrokerBalanceHistory', () => {
  it('returns empty array for empty store', () => {
    expect(calcBrokerBalanceHistory(makeStore(), 2025, 12)).toEqual([])
  })

  it('returns empty array when all activity is after upToYear-upToMonth', () => {
    const store = makeStore({
      openPositions: [{ buyDate: '2026-01-01', buyPrice: 100, qty: 1 }],
    })
    expect(calcBrokerBalanceHistory(store, 2025, 12)).toEqual([])
  })

  it('returns one entry per month from earliest activity to upToPrefix', () => {
    const store = makeStore({
      openPositions: [
        { buyDate: '2025-03-01', buyPrice: 200, qty: 1 },
        { buyDate: '2025-05-01', buyPrice: 300, qty: 1 },
      ],
    })
    const history = calcBrokerBalanceHistory(store, 2025, 5)
    // Months: Mar, Apr, May → 3 entries
    expect(history).toHaveLength(3)
    expect(history[0].prefix).toBe('2025-03')
    expect(history[2].prefix).toBe('2025-05')
  })

  it('tracks running balance correctly across months', () => {
    const store = makeStore({
      closedPositions: [
        // Jan sell: 1000 proceeds
        { buyDate: '2024-01-01', buyRate: 500, sellDate: '2025-01-10', sellPrice: 1000, qty: 1 },
        // Feb buy: 600 buys from balance (600 < 1000)
        { buyDate: '2025-02-01', buyRate: 600, sellDate: '2026-01-01', sellPrice: 700, qty: 1 },
      ],
    })
    const history = calcBrokerBalanceHistory(store, 2025, 3)
    const jan = history.find(r => r.prefix === '2025-01')
    const feb = history.find(r => r.prefix === '2025-02')

    expect(jan).toBeDefined()
    expect(jan.sellProceeds).toBe(1000)
    expect(jan.balance).toBe(1000) // 0 + 1000 proceeds, no buys in Jan

    expect(feb).toBeDefined()
    expect(feb.totalBuys).toBe(600)
    expect(feb.recycled).toBe(600) // min(1000, 600) = 600
    expect(feb.balance).toBe(400)  // 1000 - 600
  })

  it('each entry has the correct shape', () => {
    const store = makeStore({
      openPositions: [{ buyDate: '2025-06-01', buyPrice: 100, qty: 1 }],
    })
    const history = calcBrokerBalanceHistory(store, 2025, 6)
    expect(history[0]).toMatchObject({
      prefix: expect.stringMatching(/^\d{4}-\d{2}$/),
      sellProceeds: expect.any(Number),
      totalBuys: expect.any(Number),
      recycled: expect.any(Number),
      balance: expect.any(Number),
    })
  })

  it('caps recycled at available balance (cannot recycle more than balance)', () => {
    // Balance starts at 0; no sells. Buy 500. Recycled = min(0, 500) = 0.
    const store = makeStore({
      openPositions: [{ buyDate: '2025-04-01', buyPrice: 500, qty: 1 }],
    })
    const history = calcBrokerBalanceHistory(store, 2025, 4)
    expect(history[0].recycled).toBe(0)
    expect(history[0].balance).toBe(0)
  })
})
