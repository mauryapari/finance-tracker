import YahooFinance from 'yahoo-finance2'

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

export default defineEventHandler(async (event) => {
  const { symbol } = getQuery(event)
  if (!symbol) {
    throw createError({ statusCode: 400, message: 'symbol is required' })
  }
  try {
    const quote = await yf.quote(symbol)
    if (!quote || quote.regularMarketPrice == null) {
      throw createError({ statusCode: 404, message: `No price found for symbol: ${symbol}` })
    }
    return { price: quote.regularMarketPrice }
  } catch (e) {
    if (e.statusCode) throw e
    throw createError({ statusCode: 502, message: `Yahoo Finance error: ${e.message}` })
  }
})
