import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { getAuthHeaders } from '~/composables/useAuth'
import type { DataState, Tables, TableKey, StoreSummary, StorageMode } from '~/types'

const getStorageKey = (): string => useRuntimeConfig().public.storageKey as string

const CURRENT_VERSION = 2

function initialState(): Omit<DataState, 'storageMode' | 'isDemoMode'> {
  return {
    version: CURRENT_VERSION,
    tables: {
      openPositions: [],
      closedPositions: [],
      etfs: [],
      closedEtfs: [],
      commodityEtfs: [],
      closedCommodityEtfs: [],
      cagrEntries: [],
      commodityCagrEntries: [],
      budgetYears: [],
      budgetMonthly: [],
    },
  }
}

function backfillTables(parsed: { tables: Partial<Tables> }): void {
  const base = initialState()
  for (const key of Object.keys(base.tables) as TableKey[]) {
    if (!parsed.tables[key]) parsed.tables[key] = [] as never
  }
}

export const useDataStore = defineStore('data', {
  state: (): DataState => ({
    ...initialState(),
    storageMode: 'local' as StorageMode,
    isDemoMode: false,
  }),

  getters: {
    stockSummary: (state): StoreSummary => {
      const positions = state.tables.openPositions
      const netValue = positions.reduce((s, p) => s + (p.cmp || 0) * (p.qty || 0), 0)
      const totalInvested = positions.reduce((s, p) => s + (p.buyPrice || 0) * (p.qty || 0), 0)
      const profit = netValue - totalInvested
      const profitPercentage = totalInvested > 0 ? (profit / totalInvested) * 100 : 0
      return { netValue, totalInvested, profit, profitPercentage }
    },
    commoditySummary: (state): StoreSummary => {
      const positions = state.tables.commodityEtfs
      const netValue = positions.reduce((s, p) => s + (p.cmp || 0) * (p.qty || 0), 0)
      const totalInvested = positions.reduce((s, p) => s + (p.buyPrice || 0) * (p.qty || 0), 0)
      const profit = netValue - totalInvested
      const profitPercentage = totalInvested > 0 ? (profit / totalInvested) * 100 : 0
      return { netValue, totalInvested, profit, profitPercentage }
    },
  },

  actions: {
    _loadFromLocalStorage(): void {
      const raw = localStorage.getItem(getStorageKey())
      if (!raw) return
      try {
        const parsed: { tables: Partial<Tables>; version?: number } = JSON.parse(raw)
        if (!parsed.tables) return
        backfillTables(parsed)
        this.$patch({ version: CURRENT_VERSION, tables: parsed.tables as Tables })
      } catch (e) {
        console.error('Failed to load from localStorage', e)
      }
    },

    async loadFromStorage(): Promise<void> {
      if (typeof window === 'undefined') return
      try {
        const res = await fetch('/api/data', { headers: getAuthHeaders() as HeadersInit })
        const json: { configured: boolean; data?: { tables: Tables; version?: number } } = await res.json()

        if (!json.configured) {
          this._loadFromLocalStorage()
          this.storageMode = 'local'
          return
        }

        this.storageMode = 'remote'

        if (json.data) {
          backfillTables(json.data)
          this.$patch({ version: CURRENT_VERSION, tables: json.data.tables })
          return
        }

        // Redis is configured but empty — migrate localStorage data if present
        const raw = localStorage.getItem(getStorageKey())
        if (raw) {
          try {
            const parsed: { tables?: Partial<Tables> } = JSON.parse(raw)
            if (parsed.tables) {
              backfillTables(parsed as { tables: Partial<Tables> })
              this.$patch({ version: CURRENT_VERSION, tables: parsed.tables as Tables })
              await this.saveToStorage()
              localStorage.removeItem(getStorageKey())
            }
          } catch (e) {
            console.error('Failed to migrate localStorage to Redis', e)
          }
        }
      } catch (e) {
        console.error('Failed to reach /api/data, falling back to localStorage', e)
        this._loadFromLocalStorage()
        this.storageMode = 'local'
      }
    },

    loadDemoData(data: { tables: Partial<Tables> }): void {
      this.isDemoMode = true
      this.storageMode = 'demo'
      const copy: { tables: Partial<Tables> } = JSON.parse(JSON.stringify(data))
      backfillTables(copy)
      this.$patch({ version: CURRENT_VERSION, tables: copy.tables as Tables })
    },

    async saveToStorage(): Promise<void> {
      if (typeof window === 'undefined') return
      if (this.isDemoMode) return
      const payload = { version: this.version, tables: this.tables }
      if (this.storageMode === 'remote') {
        try {
          await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(getAuthHeaders() as Record<string, string>) },
            body: JSON.stringify(payload),
          })
        } catch (e) {
          console.error('Failed to save to Redis', e)
        }
        return
      }
      localStorage.setItem(getStorageKey(), JSON.stringify(payload))
    },

    addRow<K extends TableKey>(tableKey: K, row: Tables[K][number]): void {
      const id = (row as { id?: string }).id || uuidv4()
      const entry = { ...row, id }
      ;(this.tables[tableKey] as unknown as unknown[]).unshift(entry)
      this.saveToStorage()
    },

    updateRow<K extends TableKey>(tableKey: K, id: string, row: Tables[K][number]): void {
      const table = this.tables[tableKey] as unknown as Array<{ id: string }>
      const idx = table.findIndex(r => r.id === id)
      if (idx !== -1) {
        ;(this.tables[tableKey] as unknown as unknown[])[idx] = { ...row, id }
        this.saveToStorage()
      }
    },

    deleteRow(tableKey: TableKey, id: string): void {
      const table = this.tables[tableKey] as unknown as Array<{ id: string }>
      this.tables[tableKey] = table.filter(r => r.id !== id) as never
      this.saveToStorage()
    },

    updateCmp(tableKey: 'openPositions' | 'etfs' | 'commodityEtfs', id: string, price: number): void {
      const table = this.tables[tableKey] as unknown as Array<{ id: string; cmp: number; peakPrice?: number }>
      const idx = table.findIndex(r => r.id === id)
      if (idx === -1) return
      const row = table[idx]
      if (!row) return
      if (tableKey === 'openPositions' && price > (row.peakPrice || 0)) {
        table[idx] = { ...row, cmp: price, peakPrice: price }
        this.saveToStorage()
      } else {
        table[idx] = { ...row, cmp: price }
      }
    },

    updatePeak(tableKey: TableKey, id: string, peak: number): void {
      const table = this.tables[tableKey] as unknown as Array<{ id: string; peakPrice?: number }>
      const idx = table.findIndex(r => r.id === id)
      if (idx === -1) return
      const row = table[idx]
      if (!row || peak <= (row.peakPrice || 0)) return
      table[idx] = { ...row, peakPrice: peak }
      this.saveToStorage()
    },

    importAll(data: { version?: number; tables?: Partial<Tables> }): void {
      if (!data.version || !data.tables) throw new Error('Invalid data format')
      const base = initialState()
      for (const key of Object.keys(base.tables) as TableKey[]) {
        if (!data.tables[key]) data.tables[key] = [] as never
      }
      this.$patch({ version: data.version, tables: data.tables as Tables })
      this.saveToStorage()
    },
  },
})
