import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useDataStore } from '../../app/stores/data'

const NuxtLinkStub = {
  props: ['to'],
  template: '<a :href="to" v-bind="$attrs"><slot /></a>',
}

import WatchlistWidget from '../../app/components/WatchlistWidget.vue'

function makeWrapper() {
  return mount(WatchlistWidget, {
    global: {
      stubs: { NuxtLink: NuxtLinkStub },
    },
  })
}

const BUY_ENTRY = {
  id: 'b1',
  stock: 'RELIANCE',
  stockExchange: 'NSE',
  signal: 'BUY',
  score: 85,
  lastUpdated: '2026-05-01',
  notes: 'Good pick',
  buyConditions: [],
  sellConditions: [],
  holdConditions: [],
}

const SELL_ENTRY = {
  id: 's1',
  stock: 'INFY',
  stockExchange: 'NSE',
  signal: 'SELL',
  score: 30,
  lastUpdated: '2026-05-01',
  notes: 'Overvalued',
  buyConditions: [],
  sellConditions: [],
  holdConditions: [],
}

describe('WatchlistWidget', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders watchlist widget', () => {
    const wrapper = makeWrapper()
    expect(wrapper.find('[data-testid="watchlist-widget"]').exists()).toBe(true)
  })

  it('shows top buy picks', () => {
    const store = useDataStore()
    store.tables.watchlist.push(BUY_ENTRY)
    const wrapper = makeWrapper()
    expect(wrapper.find('[data-testid="top-buys"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="buy-item-RELIANCE"]').exists()).toBe(true)
  })

  it('shows sell alert when held stock has SELL signal', () => {
    const store = useDataStore()
    store.tables.watchlist.push(SELL_ENTRY)
    // Add INFY to open positions
    store.tables.openPositions.push({
      id: 'op1',
      stock: 'INFY',
      qty: 10,
      buyPrice: 1500,
      buyDate: '2025-01-01',
      cmp: 1600,
      peakPrice: 1700,
      targetPrice: 2000,
      stockExchange: 'NSE',
    })
    const wrapper = makeWrapper()
    expect(wrapper.find('[data-testid="sell-alerts"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('INFY')
  })

  it('does not show sell alert when stock is not in open positions', () => {
    const store = useDataStore()
    store.tables.watchlist.push(SELL_ENTRY)
    // No open positions added
    const wrapper = makeWrapper()
    expect(wrapper.find('[data-testid="sell-alerts"]').exists()).toBe(false)
  })

  it('limits top buys to 5', () => {
    const store = useDataStore()
    for (let i = 0; i < 8; i++) {
      store.tables.watchlist.push({
        ...BUY_ENTRY,
        id: `b${i}`,
        stock: `STOCK${i}`,
        score: 60 + i,
      })
    }
    const wrapper = makeWrapper()
    const items = wrapper.findAll('[data-testid^="buy-item-"]')
    expect(items.length).toBe(5)
  })

  it('shows see-all link with count', () => {
    const store = useDataStore()
    store.tables.watchlist.push(BUY_ENTRY)
    const wrapper = makeWrapper()
    const link = wrapper.find('[data-testid="see-all-link"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toContain('1')
  })
})
