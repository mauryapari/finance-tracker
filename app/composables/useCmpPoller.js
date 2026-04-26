import { useDataStore } from '~/stores/data'

export function useCmpPoller() {
  if (import.meta.server) return

  const store = useDataStore()
  const alreadyNotified = new Set()
  let intervalId = null

  const POLL_INTERVAL = 5 * 60 * 1000 // 5 minutes

  async function fetchAndUpdate(tableKey, position) {
    if (!position.stock) return
    const suffix = position.stockExchange === 'BSE' ? '.BO' : '.NS'
    const symbol = position.stock.includes('.') ? position.stock : position.stock + suffix
    try {
      const data = await $fetch(`/api/stock-price?symbol=${encodeURIComponent(symbol)}`)
      if (data.price != null) {
        store.updateCmp(tableKey, position.id, data.price)
        // check target hit for open positions
        if (tableKey === 'openPositions' && position.targetPrice > 0) {
          if (data.price >= position.targetPrice && !alreadyNotified.has(position.id)) {
            alreadyNotified.add(position.id)
            if (Notification.permission === 'granted') {
              new Notification(`${position.stock} hit target!`, {
                body: `CMP ₹${data.price.toFixed(2)} ≥ target ₹${position.targetPrice}`
              })
            }
          }
        }
      }
    } catch (e) {
      console.warn(`Failed to fetch price for ${symbol}:`, e)
      // silently skip failed symbols
    }
  }

  async function fetchPeak(position) {
    if (!position.stock || !position.buyDate) return
    const suffix = position.stockExchange === 'BSE' ? '.BO' : '.NS'
    const symbol = position.stock.includes('.') ? position.stock : position.stock + suffix
    try {
      const data = await $fetch(`/api/stock-peak?symbol=${encodeURIComponent(symbol)}&from=${position.buyDate}`)
      if (data.peak != null) {
        store.updatePeak('openPositions', position.id, data.peak)
      }
    } catch (e) {
      console.warn(`Failed to fetch peak for ${symbol}:`, e)
      // silently skip
    }
  }

  async function pollAll() {
    const targets = [
      ...store.tables.openPositions.map(p => ({ tableKey: 'openPositions', position: p })),
      ...store.tables.etfs.map(p => ({ tableKey: 'etfs', position: p })),
      ...store.tables.commodityEtfs.map(p => ({ tableKey: 'commodityEtfs', position: p })),
    ]
    await Promise.allSettled(targets.map(({ tableKey, position }) => fetchAndUpdate(tableKey, position)))
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
