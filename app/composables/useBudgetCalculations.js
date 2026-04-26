function monthPrefix(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`
}

function buyValueSum(rows, prefix, priceField = 'buyPrice') {
  return rows
    .filter(r => r.buyDate && r.buyDate.startsWith(prefix))
    .reduce((sum, r) => sum + (r[priceField] || 0) * (r.qty || 0), 0)
}

function gainSum(rows, prefix) {
  return rows
    .filter(r => r.sellDate && r.sellDate.startsWith(prefix))
    .reduce((sum, r) => sum + ((r.sellPrice || 0) - (r.buyRate || 0)) * (r.qty || 0), 0)
}

function matchesCommodityType(row, keyword) {
  // type field is preferred; fall back to stock name for closed rows that lack it
  return (row.type || row.stock || '').toLowerCase().includes(keyword)
}

export function calcStockEquityEtfsBreakdown(store, year, month) {
  const prefix = monthPrefix(year, month)
  return {
    openPositions: buyValueSum(store.tables.openPositions, prefix),
    closedPositions: buyValueSum(store.tables.closedPositions, prefix, 'buyRate'),
    etfs: buyValueSum(store.tables.etfs, prefix),
  }
}

export function calcStockEquityEtfs(store, year, month) {
  const b = calcStockEquityEtfsBreakdown(store, year, month)
  return b.openPositions + b.closedPositions + b.etfs
}

export function calcCommodityGold(store, year, month) {
  const prefix = monthPrefix(year, month)
  return (
    buyValueSum(store.tables.commodityEtfs.filter(r => matchesCommodityType(r, 'gold')), prefix) +
    buyValueSum(store.tables.closedCommodityEtfs.filter(r => matchesCommodityType(r, 'gold')), prefix, 'buyRate')
  )
}

export function calcCommoditySilver(store, year, month) {
  const prefix = monthPrefix(year, month)
  return (
    buyValueSum(store.tables.commodityEtfs.filter(r => matchesCommodityType(r, 'silver')), prefix) +
    buyValueSum(store.tables.closedCommodityEtfs.filter(r => matchesCommodityType(r, 'silver')), prefix, 'buyRate')
  )
}

export function calcStockProfitBooked(store, year, month) {
  const prefix = monthPrefix(year, month)
  return (
    gainSum(store.tables.closedPositions, prefix) +
    gainSum(store.tables.closedEtfs, prefix) +
    gainSum(store.tables.closedCommodityEtfs, prefix)
  )
}

function sellProceedsSum(rows, prefix) {
  return rows
    .filter(r => r.sellDate && r.sellDate.startsWith(prefix))
    .reduce((sum, r) => sum + (r.sellPrice || 0) * (r.qty || 0), 0)
}

function prefixFromDate(dateStr) {
  return dateStr ? dateStr.slice(0, 7) : null
}

// Returns an array[12] for all months of targetYear.
// Each entry: { freshStockEquityEtfs, freshCommodities, sellProceeds, brokerBalance }
// Computed by walking a running broker cash balance from the earliest activity date
// through Dec of targetYear. Sell proceeds refill the balance; buys draw it down first
// (recycled capital) before counting as fresh salary investment.
export function calcBrokerRunningBalance(store, targetYear) {
  const allDates = [
    ...store.tables.openPositions.map(r => prefixFromDate(r.buyDate)),
    ...store.tables.closedPositions.flatMap(r => [prefixFromDate(r.buyDate), prefixFromDate(r.sellDate)]),
    ...store.tables.etfs.map(r => prefixFromDate(r.buyDate)),
    ...store.tables.closedEtfs.flatMap(r => [prefixFromDate(r.buyDate), prefixFromDate(r.sellDate)]),
    ...store.tables.commodityEtfs.map(r => prefixFromDate(r.buyDate)),
    ...store.tables.closedCommodityEtfs.flatMap(r => [prefixFromDate(r.buyDate), prefixFromDate(r.sellDate)]),
  ].filter(Boolean).sort()

  const empty12 = () =>
    Array.from({ length: 12 }, () => ({ freshStockEquityEtfs: 0, freshCommodities: 0, sellProceeds: 0, brokerBalance: 0 }))

  if (!allDates.length) return empty12()

  const earliestPrefix = allDates[0]
  const endPrefix = `${targetYear}-12`
  if (earliestPrefix > endPrefix) return empty12()

  let [y, m] = earliestPrefix.split('-').map(Number)
  let brokerBalance = 0
  const resultByPrefix = {}

  while (true) {
    const prefix = `${y}-${String(m).padStart(2, '0')}`
    if (prefix > endPrefix) break

    const sp = (
      sellProceedsSum(store.tables.closedPositions, prefix) +
      sellProceedsSum(store.tables.closedEtfs, prefix) +
      sellProceedsSum(store.tables.closedCommodityEtfs, prefix)
    )
    brokerBalance += sp

    const stockBuys = (
      buyValueSum(store.tables.openPositions, prefix) +
      buyValueSum(store.tables.closedPositions, prefix, 'buyRate') +
      buyValueSum(store.tables.etfs, prefix)
    )
    const commodityBuys = (
      buyValueSum(store.tables.commodityEtfs, prefix) +
      buyValueSum(store.tables.closedCommodityEtfs, prefix, 'buyRate')
    )
    const totalBuys = stockBuys + commodityBuys
    const recycled = Math.min(brokerBalance, totalBuys)

    let freshStockEquityEtfs = stockBuys
    let freshCommodities = commodityBuys
    if (totalBuys > 0) {
      freshStockEquityEtfs = stockBuys - recycled * (stockBuys / totalBuys)
      freshCommodities = commodityBuys - recycled * (commodityBuys / totalBuys)
    }
    brokerBalance -= recycled

    resultByPrefix[prefix] = { freshStockEquityEtfs, freshCommodities, sellProceeds: sp, brokerBalance }

    m++
    if (m > 12) { m = 1; y++ }
  }

  return Array.from({ length: 12 }, (_, i) => {
    const prefix = `${targetYear}-${String(i + 1).padStart(2, '0')}`
    return resultByPrefix[prefix] ?? { freshStockEquityEtfs: 0, freshCommodities: 0, sellProceeds: 0, brokerBalance: 0 }
  })
}

// Returns full month-by-month broker balance history from earliest activity through upToYear-upToMonth.
// Each entry: { prefix, sellProceeds, totalBuys, recycled, balance }
export function calcBrokerBalanceHistory(store, upToYear, upToMonth) {
  const allDates = [
    ...store.tables.openPositions.map(r => prefixFromDate(r.buyDate)),
    ...store.tables.closedPositions.flatMap(r => [prefixFromDate(r.buyDate), prefixFromDate(r.sellDate)]),
    ...store.tables.etfs.map(r => prefixFromDate(r.buyDate)),
    ...store.tables.closedEtfs.flatMap(r => [prefixFromDate(r.buyDate), prefixFromDate(r.sellDate)]),
    ...store.tables.commodityEtfs.map(r => prefixFromDate(r.buyDate)),
    ...store.tables.closedCommodityEtfs.flatMap(r => [prefixFromDate(r.buyDate), prefixFromDate(r.sellDate)]),
  ].filter(Boolean).sort()

  if (!allDates.length) return []

  const endPrefix = `${upToYear}-${String(upToMonth).padStart(2, '0')}`
  const earliestPrefix = allDates[0]
  if (earliestPrefix > endPrefix) return []

  let [y, m] = earliestPrefix.split('-').map(Number)
  let balance = 0
  const history = []

  while (true) {
    const prefix = `${y}-${String(m).padStart(2, '0')}`
    if (prefix > endPrefix) break

    const sp = (
      sellProceedsSum(store.tables.closedPositions, prefix) +
      sellProceedsSum(store.tables.closedEtfs, prefix) +
      sellProceedsSum(store.tables.closedCommodityEtfs, prefix)
    )
    balance += sp

    const stockBuys = (
      buyValueSum(store.tables.openPositions, prefix) +
      buyValueSum(store.tables.closedPositions, prefix, 'buyRate') +
      buyValueSum(store.tables.etfs, prefix)
    )
    const commodityBuys = (
      buyValueSum(store.tables.commodityEtfs, prefix) +
      buyValueSum(store.tables.closedCommodityEtfs, prefix, 'buyRate')
    )
    const totalBuys = stockBuys + commodityBuys
    const recycled = Math.min(balance, totalBuys)
    balance -= recycled

    history.push({ prefix, sellProceeds: sp, totalBuys, recycled, balance })

    m++
    if (m > 12) { m = 1; y++ }
  }

  return history
}
