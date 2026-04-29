import { useDataStore } from '~/stores/data'

export function useCmpPoller() {
  if (import.meta.server) return

  const store = useDataStore()
  const alreadyNotified = new Set()
  let intervalId = null

  const POLL_INTERVAL = 5 * 60 * 1000 // 5 minutes

  function isMarketOpen() {
    const now = new Date()
    const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    const day = ist.getDay()
    if (day === 0 || day === 6) return false
    const minutes = ist.getHours() * 60 + ist.getMinutes()
    return minutes >= 9 * 60 + 15 && minutes < 15 * 60 + 30
  }

  function buildSymbol(position) {
    if (!position.stock) return null
    const suffix = position.stockExchange === 'BSE' ? '.BO' : '.NS'
    return position.stock.includes('.') ? position.stock : position.stock + suffix
  }

  async function fetchAllPeaks() {
    const eligible = store.tables.openPositions
      .filter(p => p.stock && p.buyDate)
      .map(p => ({ position: p, symbol: buildSymbol(p) }))
      .filter(e => e.symbol)

    if (eligible.length === 0) return

    const symbols = eligible.map(e => e.symbol).join(',')
    const froms = eligible.map(e => e.position.buyDate).join(',')

    try {
      const peakMap = await $fetch(
        `/api/stock-peak-batch?symbols=${encodeURIComponent(symbols)}&froms=${encodeURIComponent(froms)}`
      )
      for (const { position, symbol } of eligible) {
        const peak = peakMap[symbol]
        if (peak != null) store.updatePeak('openPositions', position.id, peak)
      }
    } catch (e) {
      console.warn('Failed to fetch batch peaks:', e)
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
    if (isMarketOpen()) pollAll()
    intervalId = setInterval(() => {
      if (document.visibilityState !== 'hidden' && isMarketOpen()) pollAll()
    }, POLL_INTERVAL)
  }

  onMounted(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && isMarketOpen()) pollAll()
    })
    startPolling()
    if (isMarketOpen()) {
      fetchAllPeaks()
    }
  })

  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId)
  })
}
