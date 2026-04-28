import YahooFinance from 'yahoo-finance2'

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

export default defineEventHandler(async (event) => {
  const { symbols } = getQuery(event)
  if (!symbols) {
    throw createError({ statusCode: 400, message: 'symbols is required' })
  }
  const symbolList = symbols.split(',').map(s => s.trim()).filter(Boolean)
  if (symbolList.length === 0) {
    throw createError({ statusCode: 400, message: 'symbols is required' })
  }
  try {
    const quotes = await yf.quote(symbolList)
    const result = {}
    const arr = Array.isArray(quotes) ? quotes : [quotes]
    for (const quote of arr) {
      if (quote?.symbol && quote.regularMarketPrice != null) {
        result[quote.symbol] = quote.regularMarketPrice
      }
    }
    return result
  } catch (e) {
    if (e.statusCode) throw e
    throw createError({ statusCode: 502, message: `Yahoo Finance error: ${e.message}` })
  }
})
