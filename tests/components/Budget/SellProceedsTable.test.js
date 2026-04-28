import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useDataStore } from '../../../app/stores/data.js'
import SellProceedsTable from '../../../app/components/Budget/SellProceedsTable.vue'

const PREFIX = '2025-03'

function make(props = {}) {
  return mount(SellProceedsTable, { props: { prefix: PREFIX, ...props } })
}

describe('SellProceedsTable', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useDataStore()
  })

  it('renders without error with no prefix', () => {
    expect(mount(SellProceedsTable, { props: {} }).exists()).toBe(true)
  })

  it('shows empty state when no matching rows in store', () => {
    expect(make().find('[data-testid="sell-proceeds-empty"]').exists()).toBe(true)
  })

  it('hides empty state when a closed position matches prefix sell date', () => {
    store.addRow('closedPositions', { id: 's1', stock: 'INFY', buyDate: '2024-01-10', sellDate: '2025-03-10', qty: 3, buyRate: 1500, sellPrice: 1800 })
    expect(make().find('[data-testid="sell-proceeds-empty"]').exists()).toBe(false)
  })

  it('shows stocks table only when matching closedPositions exist', () => {
    expect(make().find('[data-testid="sell-proceeds-stocks-table"]').exists()).toBe(false)
    store.addRow('closedPositions', { id: 's1', stock: 'INFY', buyDate: '2024-01-10', sellDate: '2025-03-10', qty: 3, buyRate: 1500, sellPrice: 1800 })
    expect(make().find('[data-testid="sell-proceeds-stocks-table"]').exists()).toBe(true)
  })

  it('shows ETF table only when matching closedEtfs exist', () => {
    expect(make().find('[data-testid="sell-proceeds-etf-table"]').exists()).toBe(false)
    store.addRow('closedEtfs', { id: 'e1', type: 'Equity ETF', stock: 'NIFTYBEES', buyDate: '2024-01-01', sellDate: '2025-03-15', qty: 5, buyRate: 190, sellPrice: 210 })
    expect(make().find('[data-testid="sell-proceeds-etf-table"]').exists()).toBe(true)
  })

  it('shows commodities table only when matching closedCommodityEtfs exist', () => {
    expect(make().find('[data-testid="sell-proceeds-commodities-table"]').exists()).toBe(false)
    store.addRow('closedCommodityEtfs', { id: 'c1', stock: 'GOLDBEES', buyDate: '2024-06-01', sellDate: '2025-03-20', qty: 4, buyRate: 50, sellPrice: 55 })
    expect(make().find('[data-testid="sell-proceeds-commodities-table"]').exists()).toBe(true)
  })

  it('always shows Total Inflow footer', () => {
    expect(make().find('[data-testid="sell-proceeds-total"]').exists()).toBe(true)
  })

  it('renders stock ticker from closedPositions', () => {
    store.addRow('closedPositions', { id: 's1', stock: 'INFY', buyDate: '2024-01-10', sellDate: '2025-03-10', qty: 3, buyRate: 1500, sellPrice: 1800 })
    expect(make().text()).toContain('INFY')
  })

  it('renders stock ticker from closedEtfs', () => {
    store.addRow('closedEtfs', { id: 'e1', type: 'Equity ETF', stock: 'NIFTYBEES', buyDate: '2024-01-01', sellDate: '2025-03-15', qty: 5, buyRate: 190, sellPrice: 210 })
    expect(make().text()).toContain('NIFTYBEES')
  })

  it('renders stock ticker from closedCommodityEtfs', () => {
    store.addRow('closedCommodityEtfs', { id: 'c1', stock: 'GOLDBEES', buyDate: '2024-06-01', sellDate: '2025-03-20', qty: 4, buyRate: 50, sellPrice: 55 })
    expect(make().text()).toContain('GOLDBEES')
  })

  it('does not show position sold in a different month', () => {
    store.addRow('closedPositions', { id: 's2', stock: 'WIPRO', buyDate: '2024-01-10', sellDate: '2025-02-05', qty: 10, buyRate: 400, sellPrice: 450 })
    expect(make().text()).not.toContain('WIPRO')
  })
})
