import YahooFinance from 'yahoo-finance2'

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

export default defineEventHandler(async (event) => {
  const { symbol, from } = getQuery(event)
  if (!symbol || !from) {
    throw createError({ statusCode: 400, message: 'symbol and from are required' })
  }
  try {
    const rows = await yf.historical(symbol, {
      period1: from,
      period2: new Date(),
      interval: '1d',
    })
    console.log(`Fetched ${rows.length} historical rows for ${symbol} from Yahoo Finance`)
    if (symbol === 'HDFCBANK.NS') {
      console.log('Sample row:', rows)
    }
    if (!rows?.length) return { peak: null }
    const peak = Math.max(...rows.map(r => r.high ?? 0))
    return { peak }
  } catch (e) {
    if (e.statusCode) throw e
    throw createError({ statusCode: 502, message: `Yahoo Finance error: ${e.message}` })
  }
})
