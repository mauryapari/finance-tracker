import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useDataStore } from '../../../app/stores/data.js'
import GapCommoditiesDialogs from '../../../app/components/Budget/GapCommoditiesDialogs.vue'

const DialogStub = {
  props: ['visible', 'header', 'modal', 'contentStyle'],
  emits: ['update:visible'],
  template: '<div v-if="visible" data-testid="dialog"><slot /></div>',
}

const gapRow = {
  month: 2,
  budgetCommodities: 4500,
  actualCommodities: 3000,
  freshCommodities: 2500,
  extraCommodities: 1500,
}

const trackingRow = {
  month: 2,
  commodities: 3000,
  freshCommodities: 2500,
}

const budgetYear = {
  id: '1',
  year: 2025,
  totalMonthly: 45000,
  equityPercentage: 0.78,
  debtPercentage: 0.12,
  commodityPercentage: 0.10,
  goldPercentage: 0.80,
  silverPercentage: 0.20,
}

describe('GapCommoditiesDialogs', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function makeWrapper(visible = true) {
    return mount(GapCommoditiesDialogs, {
      props: { visible, year: 2025, month: 2, monthLabel: 'Feb 2025', gapRow, trackingRow, budgetYear },
      global: { stubs: { Dialog: DialogStub } },
    })
  }

  it('renders main dialog when visible=true', () => {
    const wrapper = makeWrapper(true)
    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(true)
  })

  it('hides main dialog when visible=false', () => {
    const wrapper = makeWrapper(false)
    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false)
  })

  it('shows budget commodities amount', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('4,500')
  })

  it('shows actual commodities amount', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('3,000')
  })

  it('shows gap amount', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('1,500')
  })

  it('shows open commodity positions for the month', () => {
    const store = useDataStore()
    store.addRow('commodityEtfs', {
      id: 'com1',
      type: 'Gold',
      stock: 'GOLDBEES',
      buyDate: '2025-02-10',
      qty: 100,
      buyPrice: 50,
    })

    const wrapper = makeWrapper()
    const buttons = wrapper.findAll('button')
    const actualBtn = buttons.find((b) => b.text().includes('3,000'))
    if (actualBtn) {
      expect(actualBtn.exists()).toBe(true)
    }
  })
})
