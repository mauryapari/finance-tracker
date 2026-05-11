import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Dashboard from '../../app/components/Dashboard.vue'

vi.mock('../../app/composables/useDerivedCagrEntries.js', () => ({
  useDerivedCagrEntries: () => ({
    derivedStockCagrEntries: { value: [] },
    derivedCommodityCagrEntries: { value: [] },
  }),
}))

const SummaryCardStub = {
  props: ['title', 'summary', 'cagr', 'positions'],
  template: '<div data-testid="summary-card">{{ title }}</div>',
}

const InvestmentCalculatorStub = {
  template: '<div data-testid="investment-calculator" />',
}

describe('Dashboard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function makeWrapper() {
    return mount(Dashboard, {
      global: { stubs: { SummaryCard: SummaryCardStub, InvestmentCalculator: InvestmentCalculatorStub } },
    })
  }

  it('renders two SummaryCard components', () => {
    const wrapper = makeWrapper()
    expect(wrapper.findAll('[data-testid="summary-card"]')).toHaveLength(2)
  })

  it('renders Stock Portfolio card', () => {
    const wrapper = makeWrapper()
    const cards = wrapper.findAll('[data-testid="summary-card"]')
    expect(cards[0].text()).toContain('Stock Portfolio')
  })

  it('renders Commodity Portfolio card', () => {
    const wrapper = makeWrapper()
    const cards = wrapper.findAll('[data-testid="summary-card"]')
    expect(cards[1].text()).toContain('Commodity Portfolio')
  })

  it('renders the InvestmentCalculator', () => {
    const wrapper = makeWrapper()
    expect(wrapper.find('[data-testid="investment-calculator"]').exists()).toBe(true)
  })
})
