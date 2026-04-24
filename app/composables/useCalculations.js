export function calcDays(buyDate) {
  if (!buyDate) return 0
  const buy = new Date(buyDate)
  const today = new Date()
  return Math.max(1, Math.floor((today - buy) / 86400000))
}

export function calcBuyValue(price, qty) {
  return (price || 0) * (qty || 0)
}

export function calcCurrentValue(cmp, qty) {
  return (cmp || 0) * (qty || 0)
}

export function calcPctGain(currentValue, buyValue) {
  if (!buyValue) return 0
  return ((currentValue - buyValue) / buyValue) * 100
}

export function calcAnnualGainPct(pctGain, days) {
  if (!days) return 0
  return (pctGain / days) * 365
}

export function calcDropFromPeak(peakPrice, cmp) {
  if (!peakPrice) return 0
  return ((peakPrice - cmp) / peakPrice) * 100
}

export function calcTargetValue(targetPrice, qty) {
  return (targetPrice || 0) * (qty || 0)
}

export function calcTotalPotentialGain(targetValue, buyValue) {
  if (!buyValue) return 0
  return ((targetValue - buyValue) / buyValue) * 100
}

export function calcRemainingGain(targetValue, currentValue) {
  if (!currentValue) return 0
  return ((targetValue - currentValue) / currentValue) * 100
}

// Newton-Raphson XIRR — cashflows: [{ amount, date }]
// investments are negative, terminal value positive
export function xirr(cashflows, guess = 0.1) {
  if (!cashflows || cashflows.length < 2) return 0
  const sorted = [...cashflows].sort((a, b) => new Date(a.date) - new Date(b.date))
  const t0 = new Date(sorted[0].date)

  const years = cf => (new Date(cf.date) - t0) / (365.25 * 86400000)

  const f = r => sorted.reduce((s, cf) => s + cf.amount / Math.pow(1 + r, years(cf)), 0)
  const df = r => sorted.reduce((s, cf) => {
    const y = years(cf)
    return s - y * cf.amount / Math.pow(1 + r, y + 1)
  }, 0)

  let rate = guess
  for (let i = 0; i < 100; i++) {
    const fv = f(rate)
    if (Math.abs(fv) < 1e-7) break
    rate = rate - fv / df(rate)
    if (rate <= -1) rate = -0.9999
  }
  return rate
}

export const fmt = n =>
  n != null ? Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''

export const fmtPct = n =>
  n != null ? Number(n).toFixed(2) + '%' : ''

export const gainClass = n =>
  n >= 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-500 dark:text-red-400 font-medium'

export function calcPortfolioSummary(positions, cagrEntries) {
  const netValue = positions.reduce((s, p) => s + calcCurrentValue(p.cmp, p.qty), 0)
  const totalInvested = positions.reduce((s, p) => s + calcBuyValue(p.buyPrice, p.qty), 0)
  const profit = netValue - totalInvested
  const profitPct = totalInvested > 0 ? (profit / totalInvested) * 100 : 0

  let cagr = 0
  if (cagrEntries && cagrEntries.length > 0) {
    const cashflows = cagrEntries.map(e => ({
      amount: e.investmentOrOut === 'Out' ? Math.abs(e.amount) : -Math.abs(e.amount),
      date: e.date
    }))
    cashflows.push({ amount: netValue, date: new Date().toISOString().split('T')[0] })
    try { cagr = xirr(cashflows) * 100 } catch (e) { cagr = 0 }
  }

  return { netValue, totalInvested, profit, profitPct, cagr }
}
