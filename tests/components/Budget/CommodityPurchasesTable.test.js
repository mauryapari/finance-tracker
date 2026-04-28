import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useDataStore } from '../../../app/stores/data.js'
import CommodityPurchasesTable from '../../../app/components/Budget/CommodityPurchasesTable.vue'

const PREFIX = '2025-03'

function make(props = {}) {
  return mount(CommodityPurchasesTable, { props: { prefix: PREFIX, ...props } })
}

describe('CommodityPurchasesTable', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useDataStore()
  })

  it('renders without error with no prefix', () => {
    expect(mount(CommodityPurchasesTable, { props: {} }).exists()).toBe(true)
  })

  it('shows empty state when no matching rows in store', () => {
    expect(make().find('[data-testid="commodity-purchases-empty"]').exists()).toBe(true)
  })

  it('hides empty state when an open commodity matches prefix', () => {
    store.addRow('commodityEtfs', { id: 'o1', type: 'Gold ETF', stock: 'GOLDBEES', buyDate: '2025-03-10', qty: 5, buyPrice: 55, stockExchange: 'NSE' })
    expect(make().find('[data-testid="commodity-purchases-empty"]').exists()).toBe(false)
  })

  it('shows open positions table only when matching commodityEtfs exist', () => {
    expect(make().find('[data-testid="commodity-purchases-open-table"]').exists()).toBe(false)
    store.addRow('commodityEtfs', { id: 'o1', type: 'Gold ETF', stock: 'GOLDBEES', buyDate: '2025-03-10', qty: 5, buyPrice: 55, stockExchange: 'NSE' })
    expect(make().find('[data-testid="commodity-purchases-open-table"]').exists()).toBe(true)
  })

  it('shows closed positions table only when matching closedCommodityEtfs exist', () => {
    expect(make().find('[data-testid="commodity-purchases-closed-table"]').exists()).toBe(false)
    store.addRow('closedCommodityEtfs', { id: 'c1', type: 'Silver ETF', stock: 'SILVERBEES', buyDate: '2025-03-05', qty: 2, buyRate: 80, sellDate: '2025-04-01', sellPrice: 90 })
    expect(make().find('[data-testid="commodity-purchases-closed-table"]').exists()).toBe(true)
  })

  it('renders stock ticker from commodityEtfs', () => {
    store.addRow('commodityEtfs', { id: 'o1', type: 'Gold ETF', stock: 'GOLDBEES', buyDate: '2025-03-10', qty: 5, buyPrice: 55, stockExchange: 'NSE' })
    expect(make().text()).toContain('GOLDBEES')
  })

  it('renders stock ticker from closedCommodityEtfs', () => {
    store.addRow('closedCommodityEtfs', { id: 'c1', type: 'Silver ETF', stock: 'SILVERBEES', buyDate: '2025-03-05', qty: 2, buyRate: 80, sellDate: '2025-04-01', sellPrice: 90 })
    expect(make().text()).toContain('SILVERBEES')
  })

  it('does not render a total footer', () => {
    store.addRow('commodityEtfs', { id: 'o1', type: 'Gold ETF', stock: 'GOLDBEES', buyDate: '2025-03-10', qty: 5, buyPrice: 55, stockExchange: 'NSE' })
    expect(make().find('[data-testid="commodity-purchases-total"]').exists()).toBe(false)
  })

  it('does not show commodity from a different month', () => {
    store.addRow('commodityEtfs', { id: 'o2', type: 'Gold ETF', stock: 'SGBJAN25', buyDate: '2025-02-10', qty: 1, buyPrice: 6000, stockExchange: 'NSE' })
    expect(make().text()).not.toContain('SGBJAN25')
  })
})
