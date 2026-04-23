import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import {
  calcDays,
  calcBuyValue,
  calcCurrentValue,
  calcPctGain,
  calcAnnualGainPct,
  calcDropFromPeak,
  calcTargetValue,
  calcTotalPotentialGain,
  calcRemainingGain,
  xirr,
  calcPortfolioSummary,
} from '../app/composables/useCalculations.js'

// Pin "today" so calcDays is deterministic
const FIXED_NOW = new Date('2025-01-01T00:00:00.000Z')
beforeAll(() => { vi.useFakeTimers(); vi.setSystemTime(FIXED_NOW) })
afterAll(() => { vi.useRealTimers() })

// ---------------------------------------------------------------------------
// calcDays
// ---------------------------------------------------------------------------
describe('calcDays', () => {
  it('returns 0 for null', () => expect(calcDays(null)).toBe(0))
  it('returns 0 for undefined', () => expect(calcDays(undefined)).toBe(0))
  it('returns 0 for empty string', () => expect(calcDays('')).toBe(0))

  it('returns at least 1 for today', () => {
    expect(calcDays('2025-01-01')).toBeGreaterThanOrEqual(1)
  })

  it('returns correct days for an exact past date', () => {
    // 365 days before fixed "today"
    expect(calcDays('2024-01-01')).toBe(366) // 2024 is a leap year → 366 days
  })

  it('returns 1 (minimum) even for same-day buy', () => {
    expect(calcDays('2025-01-01')).toBeGreaterThanOrEqual(1)
  })
})

// ---------------------------------------------------------------------------
// calcBuyValue
// ---------------------------------------------------------------------------
describe('calcBuyValue', () => {
  it('returns 0 for null inputs', () => expect(calcBuyValue(null, null)).toBe(0))
  it('returns 0 when price is 0', () => expect(calcBuyValue(0, 100)).toBe(0))
  it('returns 0 when qty is 0', () => expect(calcBuyValue(100, 0)).toBe(0))
  it('calculates correctly', () => expect(calcBuyValue(150, 10)).toBe(1500))
  it('handles fractional qty', () => expect(calcBuyValue(100, 0.5)).toBeCloseTo(50))
})

// ---------------------------------------------------------------------------
// calcCurrentValue
// ---------------------------------------------------------------------------
describe('calcCurrentValue', () => {
  it('returns 0 for null inputs', () => expect(calcCurrentValue(null, null)).toBe(0))
  it('calculates correctly', () => expect(calcCurrentValue(200, 5)).toBe(1000))
  it('handles undefined cmp', () => expect(calcCurrentValue(undefined, 10)).toBe(0))
})

// ---------------------------------------------------------------------------
// calcPctGain
// ---------------------------------------------------------------------------
describe('calcPctGain', () => {
  it('returns 0 when buyValue is 0', () => expect(calcPctGain(150, 0)).toBe(0))
  it('returns 0 when buyValue is falsy', () => expect(calcPctGain(150, null)).toBe(0))
  it('returns 50% for a 50% gain', () => expect(calcPctGain(150, 100)).toBe(50))
  it('returns -20% for a 20% loss', () => expect(calcPctGain(80, 100)).toBe(-20))
  it('returns 0 for no change', () => expect(calcPctGain(100, 100)).toBe(0))
})

// ---------------------------------------------------------------------------
// calcAnnualGainPct
// ---------------------------------------------------------------------------
describe('calcAnnualGainPct', () => {
  it('returns 0 when days is 0', () => expect(calcAnnualGainPct(50, 0)).toBe(0))
  it('returns 0 when days is falsy', () => expect(calcAnnualGainPct(50, null)).toBe(0))
  it('returns same value for 365-day holding', () => {
    expect(calcAnnualGainPct(50, 365)).toBeCloseTo(50)
  })
  it('annualises a short holding', () => {
    // 10% gain over 73 days → (10/73)*365 = 50%
    expect(calcAnnualGainPct(10, 73)).toBeCloseTo(50)
  })
})

// ---------------------------------------------------------------------------
// calcDropFromPeak
// ---------------------------------------------------------------------------
describe('calcDropFromPeak', () => {
  it('returns 0 when peakPrice is 0', () => expect(calcDropFromPeak(0, 80)).toBe(0))
  it('returns 0 when peakPrice is null', () => expect(calcDropFromPeak(null, 80)).toBe(0))
  it('calculates 20% drop correctly', () => expect(calcDropFromPeak(100, 80)).toBe(20))
  it('returns 0 when at peak', () => expect(calcDropFromPeak(100, 100)).toBe(0))
  it('returns negative value when above peak', () => expect(calcDropFromPeak(100, 120)).toBe(-20))
})

// ---------------------------------------------------------------------------
// calcTargetValue
// ---------------------------------------------------------------------------
describe('calcTargetValue', () => {
  it('returns 0 for null inputs', () => expect(calcTargetValue(null, null)).toBe(0))
  it('calculates correctly', () => expect(calcTargetValue(200, 10)).toBe(2000))
})

// ---------------------------------------------------------------------------
// calcTotalPotentialGain
// ---------------------------------------------------------------------------
describe('calcTotalPotentialGain', () => {
  it('returns 0 when buyValue is 0', () => expect(calcTotalPotentialGain(2000, 0)).toBe(0))
  it('calculates 100% gain correctly', () => expect(calcTotalPotentialGain(2000, 1000)).toBe(100))
  it('calculates a loss correctly', () => expect(calcTotalPotentialGain(800, 1000)).toBe(-20))
})

// ---------------------------------------------------------------------------
// calcRemainingGain
// ---------------------------------------------------------------------------
describe('calcRemainingGain', () => {
  it('returns 0 when currentValue is 0', () => expect(calcRemainingGain(2000, 0)).toBe(0))
  it('returns 0 when currentValue is falsy', () => expect(calcRemainingGain(2000, null)).toBe(0))
  it('calculates 25% remaining gain', () => expect(calcRemainingGain(1250, 1000)).toBe(25))
  it('handles target below current', () => expect(calcRemainingGain(800, 1000)).toBe(-20))
})

// ---------------------------------------------------------------------------
// xirr
// ---------------------------------------------------------------------------
describe('xirr', () => {
  it('returns 0 for null', () => expect(xirr(null)).toBe(0))
  it('returns 0 for empty array', () => expect(xirr([])).toBe(0))
  it('returns 0 for a single cashflow', () => {
    expect(xirr([{ amount: -1000, date: '2024-01-01' }])).toBe(0)
  })

  it('computes ~10% XIRR for a one-year investment', () => {
    const cashflows = [
      { amount: -1000, date: '2024-01-01' },
      { amount: 1100, date: '2025-01-01' },
    ]
    expect(xirr(cashflows)).toBeCloseTo(0.1, 2)
  })

  it('computes a positive rate for a profitable multi-cashflow series', () => {
    const cashflows = [
      { amount: -5000, date: '2022-01-01' },
      { amount: -3000, date: '2023-01-01' },
      { amount: 10000, date: '2025-01-01' },
    ]
    const rate = xirr(cashflows)
    expect(rate).toBeGreaterThan(0)
  })

  it('computes a negative rate for a loss', () => {
    const cashflows = [
      { amount: -1000, date: '2024-01-01' },
      { amount: 800, date: '2025-01-01' },
    ]
    expect(xirr(cashflows)).toBeLessThan(0)
  })
})

// ---------------------------------------------------------------------------
// calcPortfolioSummary
// ---------------------------------------------------------------------------
describe('calcPortfolioSummary', () => {
  it('returns zeros for empty inputs', () => {
    const result = calcPortfolioSummary([], [])
    expect(result).toMatchObject({ netValue: 0, totalInvested: 0, profit: 0, profitPct: 0, cagr: 0 })
  })

  it('calculates netValue and totalInvested correctly', () => {
    const positions = [
      { buyPrice: 100, qty: 10, cmp: 150 },
      { buyPrice: 200, qty: 5, cmp: 180 },
    ]
    const result = calcPortfolioSummary(positions, [])
    expect(result.totalInvested).toBe(2000)   // 100*10 + 200*5
    expect(result.netValue).toBe(2400)          // 150*10 + 180*5
    expect(result.profit).toBe(400)
    expect(result.profitPct).toBeCloseTo(20)
  })

  it('returns profitPct 0 when no investment', () => {
    const positions = [{ buyPrice: 0, qty: 10, cmp: 150 }]
    const result = calcPortfolioSummary(positions, [])
    expect(result.profitPct).toBe(0)
  })

  it('computes cagr from cagrEntries', () => {
    const positions = [{ buyPrice: 1000, qty: 1, cmp: 1100 }]
    const cagrEntries = [
      { amount: 1000, investmentOrOut: 'In', date: '2024-01-01' },
    ]
    const result = calcPortfolioSummary(positions, cagrEntries)
    // With a net positive investment and slight gain the rate should be positive
    expect(result.cagr).toBeGreaterThan(0)
  })

  it('handles Out cashflows correctly (positive sign in xirr)', () => {
    const positions = [{ buyPrice: 500, qty: 2, cmp: 600 }]
    const cagrEntries = [
      { amount: 1000, investmentOrOut: 'In', date: '2024-01-01' },
      { amount: 200, investmentOrOut: 'Out', date: '2024-07-01' },
    ]
    const result = calcPortfolioSummary(positions, cagrEntries)
    // Just verify it doesn't throw and returns a number
    expect(typeof result.cagr).toBe('number')
  })
})
