import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useDataStore } from '../../../app/stores/data.js'
import StocksDrilldown from '../../../app/components/Budget/StocksDrilldown.vue'

const DialogStub = {
  props: ['visible', 'header', 'modal', 'contentStyle'],
  emits: ['update:visible'],
  template: '<div v-if="visible" data-testid="dialog"><slot /></div>',
}

describe('StocksDrilldown', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useDataStore()
  })

  function makeWrapper(visible = true) {
    return mount(StocksDrilldown, {
      props: { visible, year: 2025, month: 3, monthLabel: 'Mar 2025' },
      global: { stubs: { Dialog: DialogStub } },
    })
  }

  it('renders when visible=true', () => {
    expect(makeWrapper(true).find('[data-testid="dialog"]').exists()).toBe(true)
  })

  it('hides when visible=false', () => {
    expect(makeWrapper(false).find('[data-testid="dialog"]').exists()).toBe(false)
  })

  it('shows empty state when no positions in that month', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('No')
  })

  it('shows open position bought in target month', () => {
    store.addRow('openPositions', {
      id: 'p1',
      stock: 'RELIANCE',
      buyDate: '2025-03-15',
      qty: 10,
      buyPrice: 2500,
      exchange: 'NSE',
    })
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('RELIANCE')
  })

  it('does not show position from a different month', () => {
    store.addRow('openPositions', {
      id: 'p2',
      stock: 'INFY',
      buyDate: '2025-02-10',
      qty: 5,
      buyPrice: 1800,
      exchange: 'NSE',
    })
    const wrapper = makeWrapper()
    expect(wrapper.text()).not.toContain('INFY')
  })
})
