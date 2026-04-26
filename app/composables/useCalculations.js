export function calculateDays(buyDate) {
  if (!buyDate) return 0
  const buy = new Date(buyDate)
  const today = new Date()
  return Math.max(1, Math.floor((today - buy) / 86400000))
}

export function calculateBuyValue(price, qty) {
  return (price || 0) * (qty || 0)
}

export function calculateCurrentValue(cmp, qty) {
  return (cmp || 0) * (qty || 0)
}

export function calculatePercentageGain(currentValue, buyValue) {
  if (!buyValue) return 0
  return ((currentValue - buyValue) / buyValue) * 100
}

export function calculateAnnualGainPercentage(percentageGain, days) {
  if (!days) return 0
  return (percentageGain / days) * 365
}

export function calculateDropFromPeak(peakPrice, cmp) {
  if (!peakPrice) return 0
  return ((peakPrice - cmp) / peakPrice) * 100
}

export function calculateTargetValue(targetPrice, qty) {
  return (targetPrice || 0) * (qty || 0)
}

export function calculateTotalPotentialGain(targetValue, buyValue) {
  if (!buyValue) return 0
  return ((targetValue - buyValue) / buyValue) * 100
}

export function calculateRemainingGain(targetValue, currentValue) {
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

export const formatCurrency = n =>
  n != null ? Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''

export const formatPercentage = n =>
  n != null ? Number(n).toFixed(2) + '%' : ''

export const formatDuration = n => {
  if (!n || n <= 0) return '—'
  const y = Math.floor(n / 365)
  const rem = n % 365
  const m = Math.floor(rem / 30)
  const d = rem % 30
  if (y >= 1) return m > 0 ? `${y}Y ${m}M` : `${y}Y`
  if (m >= 1) return d > 0 ? `${m}M ${d}D` : `${m}M`
  return `${n}D`
}

export const gainClass = n =>
  n >= 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-500 dark:text-red-400 font-medium'

export function calcPortfolioSummary(positions, cagrEntries) {
  const netValue = positions.reduce((s, p) => s + calculateCurrentValue(p.cmp, p.qty), 0)
  const totalInvested = positions.reduce((s, p) => s + calculateBuyValue(p.buyPrice, p.qty), 0)
  const profit = netValue - totalInvested
  const profitPercentage = totalInvested > 0 ? (profit / totalInvested) * 100 : 0

  let cagr = 0
  if (cagrEntries && cagrEntries.length > 0) {
    const cashflows = cagrEntries.map(e => ({
      amount: e.investmentOrOut === 'Out' ? Math.abs(e.amount) : -Math.abs(e.amount),
      date: e.date
    }))
    cashflows.push({ amount: netValue, date: new Date().toISOString().split('T')[0] })
    try { cagr = xirr(cashflows) * 100 } catch (err) { console.warn(err); cagr = 0 }
  }

  return { netValue, totalInvested, profit, profitPercentage, cagr }
}
