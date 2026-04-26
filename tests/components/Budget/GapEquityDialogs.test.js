import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GapEquityDialogs from '../../../app/components/Budget/GapEquityDialogs.vue'

const DialogStub = {
  props: ['visible', 'header', 'modal', 'contentStyle'],
  emits: ['update:visible'],
  template: '<div v-if="visible" data-testid="dialog"><slot /></div>',
}

const gapRow = {
  month: 1,
  budgetEquity: 35100,
  actualEquity: 30000,
  freshEquity: 28000,
  extraEquity: 5100,
}

const trackingRow = {
  month: 1,
  stockEquityEtfs: 20000,
  mfEquity: 10000,
  freshEquity: 28000,
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

describe('GapEquityDialogs', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function makeWrapper(visible = true) {
    return mount(GapEquityDialogs, {
      props: { visible, year: 2025, month: 1, monthLabel: 'Jan 2025', gapRow, trackingRow, budgetYear },
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

  it('shows budget equity amount', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('35,100')
  })

  it('shows actual equity amount', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('30,000')
  })

  it('shows gap amount', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('5,100')
  })
})
