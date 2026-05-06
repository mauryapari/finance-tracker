import type { Tables, BrokerMonthEntry, BrokerHistoryEntry, StockEquityEtfsBreakdown } from '~/types'

interface TablesStore {
  tables: Tables
}

function monthPrefix(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function buyValueSum(
  rows: { buyDate?: string; qty?: number; buyPrice?: number; buyRate?: number }[],
  prefix: string,
  priceField: 'buyPrice' | 'buyRate' = 'buyPrice',
): number {
  return rows
    .filter(r => r.buyDate && r.buyDate.startsWith(prefix))
    .reduce((sum, r) => sum + (r[priceField] || 0) * (r.qty || 0), 0)
}

function gainSum(
  rows: { sellDate?: string; sellPrice?: number; buyRate?: number; qty?: number }[],
  prefix: string,
): number {
  return rows
    .filter(r => r.sellDate && r.sellDate.startsWith(prefix))
    .reduce((sum, r) => sum + ((r.sellPrice || 0) - (r.buyRate || 0)) * (r.qty || 0), 0)
}

function matchesCommodityType(
  row: { type?: string; stock?: string },
  keyword: string,
): boolean {
  return (row.type || row.stock || '').toLowerCase().includes(keyword)
}

export function calcStockEquityEtfsBreakdown(
  store: TablesStore,
  year: number,
  month: number,
): StockEquityEtfsBreakdown {
  const prefix = monthPrefix(year, month)
  return {
    openPositions: buyValueSum(store.tables.openPositions, prefix),
    closedPositions: buyValueSum(store.tables.closedPositions, prefix, 'buyRate'),
    etfs: buyValueSum(store.tables.etfs, prefix),
  }
}

export function calcStockEquityEtfs(store: TablesStore, year: number, month: number): number {
  const b = calcStockEquityEtfsBreakdown(store, year, month)
  return b.openPositions + b.closedPositions + b.etfs
}

export function calcCommodityGold(store: TablesStore, year: number, month: number): number {
  const prefix = monthPrefix(year, month)
  return (
    buyValueSum(store.tables.commodityEtfs.filter(r => matchesCommodityType(r, 'gold')), prefix) +
    buyValueSum(store.tables.closedCommodityEtfs.filter(r => matchesCommodityType(r, 'gold')), prefix, 'buyRate')
  )
}

export function calcCommoditySilver(store: TablesStore, year: number, month: number): number {
  const prefix = monthPrefix(year, month)
  return (
    buyValueSum(store.tables.commodityEtfs.filter(r => matchesCommodityType(r, 'silver')), prefix) +
    buyValueSum(store.tables.closedCommodityEtfs.filter(r => matchesCommodityType(r, 'silver')), prefix, 'buyRate')
  )
}

export function calcStockProfitBooked(store: TablesStore, year: number, month: number): number {
  const prefix = monthPrefix(year, month)
  return (
    gainSum(store.tables.closedPositions, prefix) +
    gainSum(store.tables.closedEtfs, prefix) +
    gainSum(store.tables.closedCommodityEtfs, prefix)
  )
}

function sellProceedsSum(
  rows: { sellDate?: string; sellPrice?: number; qty?: number }[],
  prefix: string,
): number {
  return rows
    .filter(r => r.sellDate && r.sellDate.startsWith(prefix))
    .reduce((sum, r) => sum + (r.sellPrice || 0) * (r.qty || 0), 0)
}

function prefixFromDate(dateStr: string | undefined): string | null {
  return dateStr ? dateStr.slice(0, 7) : null
}

export function calcBrokerRunningBalance(
  store: TablesStore,
  targetYear: number,
): BrokerMonthEntry[] {
  const allDates = [
    ...store.tables.openPositions.map(r => prefixFromDate(r.buyDate)),
    ...store.tables.closedPositions.flatMap(r => [prefixFromDate(r.buyDate), prefixFromDate(r.sellDate)]),
    ...store.tables.etfs.map(r => prefixFromDate(r.buyDate)),
    ...store.tables.closedEtfs.flatMap(r => [prefixFromDate(r.buyDate), prefixFromDate(r.sellDate)]),
    ...store.tables.commodityEtfs.map(r => prefixFromDate(r.buyDate)),
    ...store.tables.closedCommodityEtfs.flatMap(r => [prefixFromDate(r.buyDate), prefixFromDate(r.sellDate)]),
  ].filter((d): d is string => d !== null).sort()

  const empty12 = (): BrokerMonthEntry[] =>
    Array.from({ length: 12 }, () => ({ freshStockEquityEtfs: 0, freshCommodities: 0, sellProceeds: 0, brokerBalance: 0 }))

  if (!allDates.length) return empty12()

  const earliestPrefix = allDates[0]!
  const endPrefix = `${targetYear}-12`
  if (earliestPrefix > endPrefix) return empty12()

  let [y, m] = earliestPrefix.split('-').map(Number) as [number, number]
  let brokerBalance = 0
  const resultByPrefix: Record<string, BrokerMonthEntry> = {}

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

export function calcBrokerBalanceHistory(
  store: TablesStore,
  upToYear: number,
  upToMonth: number,
): BrokerHistoryEntry[] {
  const allDates = [
    ...store.tables.openPositions.map(r => prefixFromDate(r.buyDate)),
    ...store.tables.closedPositions.flatMap(r => [prefixFromDate(r.buyDate), prefixFromDate(r.sellDate)]),
    ...store.tables.etfs.map(r => prefixFromDate(r.buyDate)),
    ...store.tables.closedEtfs.flatMap(r => [prefixFromDate(r.buyDate), prefixFromDate(r.sellDate)]),
    ...store.tables.commodityEtfs.map(r => prefixFromDate(r.buyDate)),
    ...store.tables.closedCommodityEtfs.flatMap(r => [prefixFromDate(r.buyDate), prefixFromDate(r.sellDate)]),
  ].filter((d): d is string => d !== null).sort()

  if (!allDates.length) return []

  const endPrefix = `${upToYear}-${String(upToMonth).padStart(2, '0')}`
  const earliestPrefix = allDates[0]!
  if (earliestPrefix > endPrefix) return []

  let [y, m] = earliestPrefix.split('-').map(Number) as [number, number]
  let balance = 0
  const history: BrokerHistoryEntry[] = []

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
