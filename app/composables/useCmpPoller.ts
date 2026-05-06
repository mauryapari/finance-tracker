import { useDataStore } from '~/stores/data'
import { useAuth } from '~/composables/useAuth'
import type { OpenPosition, Etf, CommodityEtf, TableKey } from '~/types'

type PollablePosition = OpenPosition | Etf | CommodityEtf

export function useCmpPoller(): void {
  if (import.meta.server) return

  const store = useDataStore()
  const { isAuthenticated } = useAuth()
  const alreadyNotified = new Set<string>()
  let intervalId: ReturnType<typeof setInterval> | null = null

  const POLL_INTERVAL = isAuthenticated.value ? 5 * 60 * 1000 : 60 * 60 * 1000

  function isMarketOpen(): boolean {
    const now = new Date()
    const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    const day = ist.getDay()
    if (day === 0 || day === 6) return false
    const minutes = ist.getHours() * 60 + ist.getMinutes()
    return minutes >= 9 * 60 + 15 && minutes < 15 * 60 + 30
  }

  function buildSymbol(position: PollablePosition): string | null {
    if (!position.stock) return null
    const suffix = position.stockExchange === 'BSE' ? '.BO' : '.NS'
    return position.stock.includes('.') ? position.stock : position.stock + suffix
  }

  async function fetchAllPeaks(): Promise<void> {
    const eligible = store.tables.openPositions
      .filter(p => p.stock && p.buyDate)
      .map(p => ({ position: p, symbol: buildSymbol(p) }))
      .filter((e): e is { position: OpenPosition; symbol: string } => e.symbol !== null)

    if (eligible.length === 0) return

    const symbols = eligible.map(e => e.symbol).join(',')
    const froms = eligible.map(e => e.position.buyDate).join(',')

    try {
      const peakMap = await $fetch<Record<string, number | null>>(
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

  async function pollAll(): Promise<void> {
    const targets = [
      ...store.tables.openPositions.map(p => ({ tableKey: 'openPositions' as TableKey, position: p as PollablePosition })),
      ...store.tables.etfs.map(p => ({ tableKey: 'etfs' as TableKey, position: p as PollablePosition })),
      ...store.tables.commodityEtfs.map(p => ({ tableKey: 'commodityEtfs' as TableKey, position: p as PollablePosition })),
    ]
      .map(t => ({ ...t, symbol: buildSymbol(t.position) }))
      .filter((t): t is typeof t & { symbol: string } => t.symbol !== null)

    if (targets.length === 0) return

    const symbolList = [...new Set(targets.map(t => t.symbol))]
    let priceMap: Record<string, number> = {}
    try {
      priceMap = await $fetch<Record<string, number>>(
        `/api/stock-price?symbols=${encodeURIComponent(symbolList.join(','))}`
      )
    } catch (e) {
      console.warn('Failed to fetch batch prices:', e)
      return
    }

    for (const { tableKey, position, symbol } of targets) {
      const price = priceMap[symbol]
      if (price == null) continue
      store.updateCmp(tableKey as 'openPositions' | 'etfs' | 'commodityEtfs', position.id, price)
      if (tableKey === 'openPositions') {
        const op = position as OpenPosition
        if (op.targetPrice > 0 && price >= op.targetPrice && !alreadyNotified.has(op.id)) {
          alreadyNotified.add(op.id)
          if (Notification.permission === 'granted') {
            new Notification(`${op.stock} hit target!`, {
              body: `CMP ₹${price.toFixed(2)} ≥ target ₹${op.targetPrice}`
            })
          }
        }
      }
    }
  }

  function startPolling(): void {
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
