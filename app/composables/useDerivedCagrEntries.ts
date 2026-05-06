import { computed } from 'vue'
import { useDataStore } from '~/stores/data'
import type { CagrEntry } from '~/types'

function groupByDate(
  rows: Record<string, unknown>[],
  dateField: string,
  priceField: string,
  qtyField: string,
): Map<string, number> {
  const map = new Map<string, number>()
  for (const r of rows) {
    if (!r[dateField] || !r[priceField] || !r[qtyField]) continue
    const amount = (r[priceField] as number) * (r[qtyField] as number)
    if (amount === 0) continue
    const date = r[dateField] as string
    map.set(date, (map.get(date) || 0) + amount)
  }
  return map
}

function mergeMaps(...maps: Map<string, number>[]): Map<string, number> {
  const result = new Map<string, number>()
  for (const m of maps) {
    for (const [date, amount] of m) {
      result.set(date, (result.get(date) || 0) + amount)
    }
  }
  return result
}

function toEntries(
  map: Map<string, number>,
  investmentOrOut: 'Investment' | 'Out',
): CagrEntry[] {
  return [...map.entries()]
    .map(([date, amount]) => ({
      id: `derived-${date}-${investmentOrOut.toLowerCase()}`,
      text: '',
      date,
      amount,
      investmentOrOut,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export function useDerivedCagrEntries() {
  const store = useDataStore()

  const derivedStockCagrEntries = computed<CagrEntry[]>(() => {
    const investMap = mergeMaps(
      groupByDate(store.tables.openPositions as unknown as Record<string, unknown>[], 'buyDate', 'buyPrice', 'qty'),
      groupByDate(store.tables.etfs as unknown as Record<string, unknown>[], 'buyDate', 'buyPrice', 'qty'),
      groupByDate(store.tables.closedPositions as unknown as Record<string, unknown>[], 'buyDate', 'buyRate', 'qty'),
      groupByDate(store.tables.closedEtfs as unknown as Record<string, unknown>[], 'buyDate', 'buyRate', 'qty'),
    )
    const outMap = mergeMaps(
      groupByDate(store.tables.closedPositions as unknown as Record<string, unknown>[], 'sellDate', 'sellPrice', 'qty'),
      groupByDate(store.tables.closedEtfs as unknown as Record<string, unknown>[], 'sellDate', 'sellPrice', 'qty'),
    )
    return [
      ...toEntries(investMap, 'Investment'),
      ...toEntries(outMap, 'Out'),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  })

  const derivedCommodityCagrEntries = computed<CagrEntry[]>(() => {
    const investMap = mergeMaps(
      groupByDate(store.tables.commodityEtfs as unknown as Record<string, unknown>[], 'buyDate', 'buyPrice', 'qty'),
      groupByDate(store.tables.closedCommodityEtfs as unknown as Record<string, unknown>[], 'buyDate', 'buyRate', 'qty'),
    )
    const outMap = mergeMaps(
      groupByDate(store.tables.closedCommodityEtfs as unknown as Record<string, unknown>[], 'sellDate', 'sellPrice', 'qty'),
    )
    return [
      ...toEntries(investMap, 'Investment'),
      ...toEntries(outMap, 'Out'),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  })

  return { derivedStockCagrEntries, derivedCommodityCagrEntries }
}
