import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useDataStore } from '../../../app/stores/data'
import BalanceHistory from '../../../app/components/Budget/BalanceHistory.vue'

const DialogStub = {
  props: ['visible', 'header', 'modal', 'contentStyle', 'style'],
  emits: ['update:visible'],
  template: '<div v-if="visible" :data-testid="`dialog-${header}`"><span class="dialog-header">{{ header }}</span><slot /></div>',
}

const ButtonStub = {
  props: ['label', 'variant', 'ariaLabel'],
  emits: ['click'],
  template: '<button :aria-label="ariaLabel" @click="$emit(\'click\')">{{ label }}</button>',
}

describe('BalanceHistory', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function makeWrapper(props = {}) {
    return mount(BalanceHistory, {
      props: { visible: true, year: 2025, month: 3, monthLabel: 'Mar 2025', ...props },
      global: { stubs: { Dialog: DialogStub, Button: ButtonStub } },
    })
  }

  it('renders the main dialog when visible=true', () => {
    const wrapper = makeWrapper()
    expect(wrapper.find('[data-testid="dialog-Broker Cash Balance History — through Mar 2025"]').exists()).toBe(true)
  })

  it('hides main dialog when visible=false', () => {
    const wrapper = makeWrapper({ visible: false })
    expect(wrapper.find('[data-testid="dialog-Broker Cash Balance History — through Mar 2025"]').exists()).toBe(false)
  })

  it('renders empty state message when no broker activity', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('No broker activity')
  })

  it('renders table headers', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('Sell Proceeds')
    expect(wrapper.text()).toContain('Total Purchases')
  })

  describe('with data spanning multiple years', () => {
    function seedStore() {
      const store = useDataStore()
      store.tables.closedPositions = [
        { buyDate: '2024-06-01', sellDate: '2024-07-01', buyRate: 100, sellPrice: 150, qty: 10, symbol: 'A', exchange: 'NSE' },
        { buyDate: '2025-01-05', sellDate: '2025-02-10', buyRate: 200, sellPrice: 250, qty: 5, symbol: 'B', exchange: 'NSE' },
      ]
    }

    it('shows year summary rows for years before the selected year', () => {
      seedStore()
      const wrapper = makeWrapper({ year: 2025, month: 3 })
      expect(wrapper.text()).toContain('2024')
    })

    it('shows individual month rows for the selected year', () => {
      seedStore()
      const wrapper = makeWrapper({ year: 2025, month: 3 })
      expect(wrapper.text()).toContain('2025-01')
      expect(wrapper.text()).toContain('2025-02')
    })

    it('does not show individual month rows for past years in the main table', () => {
      seedStore()
      const wrapper = makeWrapper({ year: 2025, month: 3 })
      expect(wrapper.text()).not.toContain('2024-06')
      expect(wrapper.text()).not.toContain('2024-07')
    })

    it('opens year breakdown dialog when a year summary row is clicked', async () => {
      seedStore()
      const wrapper = makeWrapper({ year: 2025, month: 3 })
      const expandBtn = wrapper.find('button[aria-label="View monthly breakdown for 2024"]')
      expect(expandBtn.exists()).toBe(true)
      await expandBtn.trigger('click')
      expect(wrapper.text()).toContain('Monthly Breakdown — 2024')
    })

    it('shows individual months inside the year breakdown dialog', async () => {
      seedStore()
      const wrapper = makeWrapper({ year: 2025, month: 3 })
      const expandBtn = wrapper.find('button[aria-label="View monthly breakdown for 2024"]')
      await expandBtn.trigger('click')
      expect(wrapper.text()).toContain('2024-06')
    })
  })
})
