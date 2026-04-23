import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

const mockQuote = vi.fn()

// Must be hoisted — mocks the yahoo-finance2 module before any import resolves it.
// Arrow functions cannot be used as constructors (new YahooFinance()), so use a class.
vi.mock('yahoo-finance2', () => ({
  default: class {
    constructor() { this.quote = mockQuote }
  },
}))

let handler

beforeAll(async () => {
  // Stub Nitro server-runtime globals so the module can be imported outside Nuxt
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
  // Default getQuery returns nothing (overridden per test)
  globalThis.getQuery = vi.fn(() => ({}))
})

// ---------------------------------------------------------------------------
// 400 — missing symbol
// ---------------------------------------------------------------------------
describe('400 — missing symbol', () => {
  it('throws a 400 error when symbol is absent', async () => {
    globalThis.getQuery = vi.fn(() => ({}))
    await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws a 400 error when symbol is empty string', async () => {
    globalThis.getQuery = vi.fn(() => ({ symbol: '' }))
    await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
  })
})

// ---------------------------------------------------------------------------
// 200 — happy path
// ---------------------------------------------------------------------------
describe('200 — successful price fetch', () => {
  it('returns { price } for a valid symbol', async () => {
    globalThis.getQuery = vi.fn(() => ({ symbol: 'RELIANCE.NS' }))
    mockQuote.mockResolvedValue({ regularMarketPrice: 2450.75 })
    const result = await handler({})
    expect(result).toEqual({ price: 2450.75 })
  })

  it('calls yahoo-finance2 quote with the exact symbol', async () => {
    globalThis.getQuery = vi.fn(() => ({ symbol: 'TCS.NS' }))
    mockQuote.mockResolvedValue({ regularMarketPrice: 3800 })
    await handler({})
    expect(mockQuote).toHaveBeenCalledWith('TCS.NS')
  })
})

// ---------------------------------------------------------------------------
// 404 — symbol found but no price
// ---------------------------------------------------------------------------
describe('404 — price not found', () => {
  it('throws 404 when regularMarketPrice is null', async () => {
    globalThis.getQuery = vi.fn(() => ({ symbol: 'UNKNOWN.NS' }))
    mockQuote.mockResolvedValue({ regularMarketPrice: null })
    await expect(handler({})).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 404 when quote returns null', async () => {
    globalThis.getQuery = vi.fn(() => ({ symbol: 'GHOST.NS' }))
    mockQuote.mockResolvedValue(null)
    await expect(handler({})).rejects.toMatchObject({ statusCode: 404 })
  })
})

// ---------------------------------------------------------------------------
// 502 — Yahoo Finance error
// ---------------------------------------------------------------------------
describe('502 — upstream error', () => {
  it('wraps Yahoo Finance network errors as 502', async () => {
    globalThis.getQuery = vi.fn(() => ({ symbol: 'FAIL.NS' }))
    mockQuote.mockRejectedValue(new Error('Network timeout'))
    await expect(handler({})).rejects.toMatchObject({ statusCode: 502 })
  })

  it('re-throws errors that already have a statusCode', async () => {
    globalThis.getQuery = vi.fn(() => ({ symbol: 'ALREADY.NS' }))
    const alreadyError = Object.assign(new Error('Not found'), { statusCode: 404 })
    mockQuote.mockRejectedValue(alreadyError)
    await expect(handler({})).rejects.toMatchObject({ statusCode: 404 })
  })
})
