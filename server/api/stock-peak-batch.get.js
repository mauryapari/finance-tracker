import YahooFinance from 'yahoo-finance2'

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

async function fetchPeak(symbol, from) {
  try {
    const rows = await yf.historical(symbol, {
      period1: from,
      period2: new Date(),
      interval: '1d',
    })
    if (!rows?.length) return null
    return Math.max(...rows.map(r => r.high ?? 0))
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  const { symbols, froms } = getQuery(event)
  if (!symbols || !froms) {
    throw createError({ statusCode: 400, message: 'symbols and froms are required' })
  }

  const symbolList = symbols.split(',').map(s => s.trim())
  const fromList = froms.split(',').map(f => f.trim())

  if (symbolList.length !== fromList.length) {
    throw createError({ statusCode: 400, message: 'symbols and froms must have the same length' })
  }

  const peaks = await Promise.all(symbolList.map((sym, i) => fetchPeak(sym, fromList[i])))

  return Object.fromEntries(symbolList.map((sym, i) => [sym, peaks[i]]))
})
