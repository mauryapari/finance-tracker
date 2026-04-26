import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useDataStore } from '../../../app/stores/data.js'
import SellsDrilldown from '../../../app/components/Budget/SellsDrilldown.vue'

const DialogStub = {
  props: ['visible', 'header', 'modal', 'contentStyle'],
  emits: ['update:visible'],
  template: '<div v-if="visible" data-testid="dialog"><slot /></div>',
}

describe('SellsDrilldown', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useDataStore()
  })

  function makeWrapper(visible = true) {
    return mount(SellsDrilldown, {
      props: { visible, year: 2025, month: 4, monthLabel: 'Apr 2025' },
      global: { stubs: { Dialog: DialogStub } },
    })
  }

  it('renders when visible=true', () => {
    expect(makeWrapper(true).find('[data-testid="dialog"]').exists()).toBe(true)
  })

  it('hides when visible=false', () => {
    expect(makeWrapper(false).find('[data-testid="dialog"]').exists()).toBe(false)
  })

  it('shows empty state when no sells in that month', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('No')
  })

  it('shows closed position sold in target month', () => {
    store.addRow('closedPositions', {
      id: 'c1',
      stock: 'TCS',
      buyDate: '2024-01-10',
      sellDate: '2025-04-20',
      qty: 5,
      buyRate: 3500,
      sellPrice: 4000,
      exchange: 'NSE',
    })
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('TCS')
  })

  it('does not show position sold in a different month', () => {
    store.addRow('closedPositions', {
      id: 'c2',
      stock: 'WIPRO',
      buyDate: '2024-01-10',
      sellDate: '2025-03-05',
      qty: 10,
      buyRate: 400,
      sellPrice: 450,
      exchange: 'NSE',
    })
    const wrapper = makeWrapper()
    expect(wrapper.text()).not.toContain('WIPRO')
  })
})
