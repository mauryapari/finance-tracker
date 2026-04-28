import { useDataStore } from '~/stores/data'

export function useCmpPoller() {
  if (import.meta.server) return

  const store = useDataStore()
  const alreadyNotified = new Set()
  let intervalId = null

  const POLL_INTERVAL = 5 * 60 * 1000 // 5 minutes

  function buildSymbol(position) {
    if (!position.stock) return null
    const suffix = position.stockExchange === 'BSE' ? '.BO' : '.NS'
    return position.stock.includes('.') ? position.stock : position.stock + suffix
  }

  async function fetchPeak(position) {
    if (!position.stock || !position.buyDate) return
    const symbol = buildSymbol(position)
    try {
      const data = await $fetch(`/api/stock-peak?symbol=${encodeURIComponent(symbol)}&from=${position.buyDate}`)
      if (data.peak != null) {
        store.updatePeak('openPositions', position.id, data.peak)
      }
    } catch (e) {
      console.warn(`Failed to fetch peak for ${symbol}:`, e)
    }
  }

  async function pollAll() {
    const targets = [
      ...store.tables.openPositions.map(p => ({ tableKey: 'openPositions', position: p })),
      ...store.tables.etfs.map(p => ({ tableKey: 'etfs', position: p })),
      ...store.tables.commodityEtfs.map(p => ({ tableKey: 'commodityEtfs', position: p })),
    ].map(t => ({ ...t, symbol: buildSymbol(t.position) })).filter(t => t.symbol)

    if (targets.length === 0) return

    const symbolList = [...new Set(targets.map(t => t.symbol))]
    let priceMap = {}
    try {
      priceMap = await $fetch(`/api/stock-price?symbols=${encodeURIComponent(symbolList.join(','))}`)
    } catch (e) {
      console.warn('Failed to fetch batch prices:', e)
      return
    }

    for (const { tableKey, position, symbol } of targets) {
      const price = priceMap[symbol]
      if (price == null) continue
      store.updateCmp(tableKey, position.id, price)
      if (tableKey === 'openPositions' && position.targetPrice > 0) {
        if (price >= position.targetPrice && !alreadyNotified.has(position.id)) {
          alreadyNotified.add(position.id)
          if (Notification.permission === 'granted') {
            new Notification(`${position.stock} hit target!`, {
              body: `CMP ₹${price.toFixed(2)} ≥ target ₹${position.targetPrice}`
            })
          }
        }
      }
    }
  }

  function startPolling() {
    pollAll()
    intervalId = setInterval(() => {
      if (document.visibilityState !== 'hidden') pollAll()
    }, POLL_INTERVAL)
  }

  onMounted(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') pollAll()
    })
    startPolling()
    Promise.allSettled(store.tables.openPositions.map(p => fetchPeak(p)))
  })

  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId)
  })
}
