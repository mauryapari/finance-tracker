import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useDataStore } from '../../../app/stores/data.js'
import StockPurchasesTable from '../../../app/components/Budget/StockPurchasesTable.vue'

const PREFIX = '2025-03'

function make(props = {}) {
  return mount(StockPurchasesTable, { props: { prefix: PREFIX, ...props } })
}

describe('StockPurchasesTable', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useDataStore()
  })

  it('renders without error with no prefix', () => {
    const wrapper = mount(StockPurchasesTable, { props: {} })
    expect(wrapper.exists()).toBe(true)
  })

  it('shows empty state when no matching rows in store', () => {
    const wrapper = make()
    expect(wrapper.find('[data-testid="stock-purchases-empty"]').exists()).toBe(true)
  })

  it('hides empty state when an open position matches prefix', () => {
    store.addRow('openPositions', { id: 'o1', stock: 'RELIANCE', buyDate: '2025-03-10', qty: 5, buyPrice: 2000, stockExchange: 'NSE' })
    expect(make().find('[data-testid="stock-purchases-empty"]').exists()).toBe(false)
  })

  it('shows open positions table only when matching openPositions exist', () => {
    expect(make().find('[data-testid="stock-purchases-open-table"]').exists()).toBe(false)
    store.addRow('openPositions', { id: 'o1', stock: 'RELIANCE', buyDate: '2025-03-10', qty: 5, buyPrice: 2000, stockExchange: 'NSE' })
    expect(make().find('[data-testid="stock-purchases-open-table"]').exists()).toBe(true)
  })

  it('shows closed positions table only when matching closedPositions exist', () => {
    expect(make().find('[data-testid="stock-purchases-closed-table"]').exists()).toBe(false)
    store.addRow('closedPositions', { id: 'c1', stock: 'INFY', buyDate: '2025-03-05', qty: 2, buyRate: 1500, sellDate: '2025-04-01', sellPrice: 1700 })
    expect(make().find('[data-testid="stock-purchases-closed-table"]').exists()).toBe(true)
  })

  it('shows ETF table only when matching etfs exist', () => {
    expect(make().find('[data-testid="stock-purchases-etf-table"]').exists()).toBe(false)
    store.addRow('etfs', { id: 'e1', type: 'Equity ETF', stock: 'NIFTYBEES', buyDate: '2025-03-20', qty: 10, buyPrice: 200, stockExchange: 'NSE' })
    expect(make().find('[data-testid="stock-purchases-etf-table"]').exists()).toBe(true)
  })

  it('shows total footer by default', () => {
    store.addRow('openPositions', { id: 'o1', stock: 'RELIANCE', buyDate: '2025-03-10', qty: 5, buyPrice: 2000, stockExchange: 'NSE' })
    expect(make().find('[data-testid="stock-purchases-total"]').exists()).toBe(true)
  })

  it('hides total footer when showTotal=false', () => {
    store.addRow('openPositions', { id: 'o1', stock: 'RELIANCE', buyDate: '2025-03-10', qty: 5, buyPrice: 2000, stockExchange: 'NSE' })
    expect(make({ showTotal: false }).find('[data-testid="stock-purchases-total"]').exists()).toBe(false)
  })

  it('uses totalLabel prop in footer', () => {
    store.addRow('openPositions', { id: 'o1', stock: 'RELIANCE', buyDate: '2025-03-10', qty: 5, buyPrice: 2000, stockExchange: 'NSE' })
    const wrapper = make({ totalLabel: 'Custom Label' })
    expect(wrapper.find('[data-testid="stock-purchases-total"]').text()).toContain('Custom Label')
  })

  it('renders stock ticker from openPositions', () => {
    store.addRow('openPositions', { id: 'o1', stock: 'RELIANCE', buyDate: '2025-03-10', qty: 5, buyPrice: 2000, stockExchange: 'NSE' })
    expect(make().text()).toContain('RELIANCE')
  })

  it('renders stock ticker from closedPositions', () => {
    store.addRow('closedPositions', { id: 'c1', stock: 'INFY', buyDate: '2025-03-05', qty: 2, buyRate: 1500, sellDate: '2025-04-01', sellPrice: 1700 })
    expect(make().text()).toContain('INFY')
  })

  it('renders stock ticker from etfs', () => {
    store.addRow('etfs', { id: 'e1', type: 'Equity ETF', stock: 'NIFTYBEES', buyDate: '2025-03-20', qty: 10, buyPrice: 200, stockExchange: 'NSE' })
    expect(make().text()).toContain('NIFTYBEES')
  })

  it('does not show position from a different month', () => {
    store.addRow('openPositions', { id: 'o2', stock: 'TCS', buyDate: '2025-02-10', qty: 3, buyPrice: 3000, stockExchange: 'NSE' })
    expect(make().text()).not.toContain('TCS')
  })
})
