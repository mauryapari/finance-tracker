import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TotalDrilldown from '../../../app/components/Budget/TotalDrilldown.vue'

const DialogStub = {
  props: ['visible', 'header', 'modal'],
  emits: ['update:visible'],
  template: '<div v-if="visible" data-testid="dialog"><slot /></div>',
}

const trackingRow = {
  month: 3,
  monthLabel: 'Mar 2025',
  stockEquityEtfs: 10000,
  stockEquityEtfsBreakdown: { openPositions: 6000, closedPositions: 2000, etfs: 2000 },
  mfEquity: 5000,
  ppf: 2000,
  commoditiesGold: 1000,
  commoditiesSilver: 500,
  commodities: 1500,
  totalEquity: 15000,
  totalCommodities: 1500,
  total: 17000,
}

describe('TotalDrilldown', () => {
  it('renders dialog when visible=true', () => {
    const wrapper = mount(TotalDrilldown, {
      props: { visible: true, monthLabel: 'Mar 2025', trackingRow },
      global: { stubs: { Dialog: DialogStub } },
    })
    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(true)
  })

  it('does not render dialog when visible=false', () => {
    const wrapper = mount(TotalDrilldown, {
      props: { visible: false, monthLabel: 'Mar 2025', trackingRow },
      global: { stubs: { Dialog: DialogStub } },
    })
    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false)
  })

  it('renders total amount', () => {
    const wrapper = mount(TotalDrilldown, {
      props: { visible: true, monthLabel: 'Mar 2025', trackingRow },
      global: { stubs: { Dialog: DialogStub } },
    })
    expect(wrapper.text()).toContain('17,000')
  })

  it('renders stock equity amount', () => {
    const wrapper = mount(TotalDrilldown, {
      props: { visible: true, monthLabel: 'Mar 2025', trackingRow },
      global: { stubs: { Dialog: DialogStub } },
    })
    expect(wrapper.text()).toContain('10,000')
  })
})
