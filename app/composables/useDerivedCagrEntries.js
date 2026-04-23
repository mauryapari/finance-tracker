import { computed } from 'vue'
import { useDataStore } from '~/stores/data'

function groupByDate(rows, dateField, priceField, qtyField) {
  const map = new Map()
  for (const r of rows) {
    if (!r[dateField] || !r[priceField] || !r[qtyField]) continue
    const amount = r[priceField] * r[qtyField]
    if (amount === 0) continue
    map.set(r[dateField], (map.get(r[dateField]) || 0) + amount)
  }
  return map
}

function mergeMaps(...maps) {
  const result = new Map()
  for (const m of maps) {
    for (const [date, amount] of m) {
      result.set(date, (result.get(date) || 0) + amount)
    }
  }
  return result
}

function toEntries(map, investmentOrOut) {
  return [...map.entries()]
    .map(([date, amount]) => ({
      id: `derived-${date}-${investmentOrOut.toLowerCase()}`,
      date,
      amount,
      investmentOrOut,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
}

export function useDerivedCagrEntries() {
  const store = useDataStore()

  const derivedStockCagrEntries = computed(() => {
    const investMap = mergeMaps(
      groupByDate(store.tables.openPositions,   'buyDate', 'buyPrice', 'qty'),
      groupByDate(store.tables.etfs,            'buyDate', 'buyPrice', 'qty'),
      groupByDate(store.tables.closedPositions, 'buyDate', 'buyRate',  'qty'),
      groupByDate(store.tables.closedEtfs,      'buyDate', 'buyRate',  'qty'),
    )
    const outMap = mergeMaps(
      groupByDate(store.tables.closedPositions, 'sellDate', 'sellPrice', 'qty'),
      groupByDate(store.tables.closedEtfs,      'sellDate', 'sellPrice', 'qty'),
    )
    return [
      ...toEntries(investMap, 'Investment'),
      ...toEntries(outMap, 'Out'),
    ].sort((a, b) => new Date(a.date) - new Date(b.date))
  })

  const derivedCommodityCagrEntries = computed(() => {
    const investMap = mergeMaps(
      groupByDate(store.tables.commodityEtfs,       'buyDate', 'buyPrice', 'qty'),
      groupByDate(store.tables.closedCommodityEtfs, 'buyDate', 'buyRate',  'qty'),
    )
    const outMap = mergeMaps(
      groupByDate(store.tables.closedCommodityEtfs, 'sellDate', 'sellPrice', 'qty'),
    )
    return [
      ...toEntries(investMap, 'Investment'),
      ...toEntries(outMap, 'Out'),
    ].sort((a, b) => new Date(a.date) - new Date(b.date))
  })

  return { derivedStockCagrEntries, derivedCommodityCagrEntries }
}
