import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'

const STORAGE_KEY = 'finance_tracker_data'
const CURRENT_VERSION = 2

const initialState = () => ({
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
  }
})

export const useDataStore = defineStore('data', {
  state: () => initialState(),

  getters: {
    stockSummary: (state) => {
      const positions = state.tables.openPositions
      const netValue = positions.reduce((s, p) => s + (p.cmp || 0) * (p.qty || 0), 0)
      const totalInvested = positions.reduce((s, p) => s + (p.buyPrice || 0) * (p.qty || 0), 0)
      const profit = netValue - totalInvested
      const profitPercentage = totalInvested > 0 ? (profit / totalInvested) * 100 : 0
      return { netValue, totalInvested, profit, profitPercentage }
    },
    commoditySummary: (state) => {
      const positions = state.tables.commodityEtfs
      const netValue = positions.reduce((s, p) => s + (p.cmp || 0) * (p.qty || 0), 0)
      const totalInvested = positions.reduce((s, p) => s + (p.buyPrice || 0) * (p.qty || 0), 0)
      const profit = netValue - totalInvested
      const profitPercentage = totalInvested > 0 ? (profit / totalInvested) * 100 : 0
      return { netValue, totalInvested, profit, profitPercentage }
    }
  },

  actions: {
    loadFromStorage() {
      if (typeof window === 'undefined') return
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      try {
        const parsed = JSON.parse(raw)
        if (!parsed.tables) return
        // backfill any missing table keys (handles all version migrations)
        const base = initialState()
        for (const key of Object.keys(base.tables)) {
          if (!parsed.tables[key]) parsed.tables[key] = []
        }
        this.$patch({ version: CURRENT_VERSION, tables: parsed.tables })
      } catch (e) {
        console.error('Failed to load from localStorage', e)
      }
    },

    saveToStorage() {
      if (typeof window === 'undefined') return
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: this.version, tables: this.tables }))
    },

    addRow(tableKey, row) {
      this.tables[tableKey].unshift({ ...row, id: row.id || uuidv4() })
      this.saveToStorage()
    },

    updateRow(tableKey, id, row) {
      const idx = this.tables[tableKey].findIndex(r => r.id === id)
      if (idx !== -1) {
        this.tables[tableKey][idx] = { ...row, id }
        this.saveToStorage()
      }
    },

    deleteRow(tableKey, id) {
      this.tables[tableKey] = this.tables[tableKey].filter(r => r.id !== id)
      this.saveToStorage()
    },

    updateCmp(tableKey, id, price) {
      const idx = this.tables[tableKey].findIndex(r => r.id === id)
      if (idx !== -1) {
        const row = this.tables[tableKey][idx]
        const update = { ...row, cmp: price }
        if (tableKey === 'openPositions' && price > (row.peakPrice || 0)) {
          update.peakPrice = price
          this.tables[tableKey][idx] = update
          this.saveToStorage()
        } else {
          this.tables[tableKey][idx] = update
          // CMP stays transient
        }
      }
    },

    updatePeak(tableKey, id, peak) {
      const idx = this.tables[tableKey].findIndex(r => r.id === id)
      if (idx !== -1 && peak > (this.tables[tableKey][idx].peakPrice || 0)) {
        this.tables[tableKey][idx] = { ...this.tables[tableKey][idx], peakPrice: peak }
        this.saveToStorage()
      }
    },

    importAll(data) {
      if (!data.version || !data.tables) throw new Error('Invalid data format')
      const base = initialState()
      for (const key of Object.keys(base.tables)) {
        if (!data.tables[key]) data.tables[key] = []
      }
      this.$patch({ version: data.version, tables: data.tables })
      this.saveToStorage()
    }
  }
})
