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

describe('Dashboard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function makeWrapper() {
    return mount(Dashboard, {
      global: { stubs: { SummaryCard: SummaryCardStub } },
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
})
