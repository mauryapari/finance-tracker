import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

const mockQuote = vi.fn()

vi.mock('yahoo-finance2', () => ({
  default: class {
    constructor() { this.quote = mockQuote }
  },
}))

let handler

beforeAll(async () => {
  vi.stubGlobal('defineEventHandler', fn => fn)
  vi.stubGlobal('getQuery', vi.fn())
  vi.stubGlobal('createError', ({ statusCode, message }) => {
    const err = new Error(message)
    err.statusCode = statusCode
    return err
  })

  const mod = await import('../../server/api/stock-price.get.js')
  handler = mod.default
})

beforeEach(() => {
  mockQuote.mockReset()
  globalThis.getQuery = vi.fn(() => ({}))
})

// ---------------------------------------------------------------------------
// 400 — missing symbols
// ---------------------------------------------------------------------------
describe('400 — missing symbols', () => {
  it('throws a 400 error when symbols is absent', async () => {
    globalThis.getQuery = vi.fn(() => ({}))
    await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws a 400 error when symbols is empty string', async () => {
    globalThis.getQuery = vi.fn(() => ({ symbols: '' }))
    await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
  })
})

// ---------------------------------------------------------------------------
// 200 — happy path
// ---------------------------------------------------------------------------
describe('200 — successful price fetch', () => {
  it('returns a price map for a single symbol', async () => {
    globalThis.getQuery = vi.fn(() => ({ symbols: 'RELIANCE.NS' }))
    mockQuote.mockResolvedValue([{ symbol: 'RELIANCE.NS', regularMarketPrice: 2450.75 }])
    const result = await handler({})
    expect(result).toEqual({ 'RELIANCE.NS': 2450.75 })
  })

  it('returns a price map for multiple symbols', async () => {
    globalThis.getQuery = vi.fn(() => ({ symbols: 'RELIANCE.NS,TCS.NS' }))
    mockQuote.mockResolvedValue([
      { symbol: 'RELIANCE.NS', regularMarketPrice: 2450.75 },
      { symbol: 'TCS.NS', regularMarketPrice: 3800 },
    ])
    const result = await handler({})
    expect(result).toEqual({ 'RELIANCE.NS': 2450.75, 'TCS.NS': 3800 })
  })

  it('calls yahoo-finance2 quote with an array of symbols', async () => {
    globalThis.getQuery = vi.fn(() => ({ symbols: 'RELIANCE.NS,TCS.NS' }))
    mockQuote.mockResolvedValue([
      { symbol: 'RELIANCE.NS', regularMarketPrice: 2450.75 },
      { symbol: 'TCS.NS', regularMarketPrice: 3800 },
    ])
    await handler({})
    expect(mockQuote).toHaveBeenCalledWith(['RELIANCE.NS', 'TCS.NS'])
  })

  it('omits symbols with null regularMarketPrice', async () => {
    globalThis.getQuery = vi.fn(() => ({ symbols: 'RELIANCE.NS,UNKNOWN.NS' }))
    mockQuote.mockResolvedValue([
      { symbol: 'RELIANCE.NS', regularMarketPrice: 2450.75 },
      { symbol: 'UNKNOWN.NS', regularMarketPrice: null },
    ])
    const result = await handler({})
    expect(result).toEqual({ 'RELIANCE.NS': 2450.75 })
  })
})

// ---------------------------------------------------------------------------
// 502 — Yahoo Finance error
// ---------------------------------------------------------------------------
describe('502 — upstream error', () => {
  it('wraps Yahoo Finance network errors as 502', async () => {
    globalThis.getQuery = vi.fn(() => ({ symbols: 'FAIL.NS' }))
    mockQuote.mockRejectedValue(new Error('Network timeout'))
    await expect(handler({})).rejects.toMatchObject({ statusCode: 502 })
  })

  it('re-throws errors that already have a statusCode', async () => {
    globalThis.getQuery = vi.fn(() => ({ symbols: 'ALREADY.NS' }))
    const alreadyError = Object.assign(new Error('Not found'), { statusCode: 404 })
    mockQuote.mockRejectedValue(alreadyError)
    await expect(handler({})).rejects.toMatchObject({ statusCode: 404 })
  })
})
