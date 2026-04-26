import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import BalanceHistory from '../../../app/components/Budget/BalanceHistory.vue'

const DialogStub = {
  props: ['visible', 'header', 'modal', 'contentStyle'],
  emits: ['update:visible'],
  template: '<div v-if="visible" data-testid="dialog"><slot /></div>',
}

describe('BalanceHistory', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function makeWrapper(visible = true) {
    return mount(BalanceHistory, {
      props: { visible, year: 2025, month: 3, monthLabel: 'Mar 2025' },
      global: { stubs: { Dialog: DialogStub } },
    })
  }

  it('renders the main dialog when visible=true', () => {
    const wrapper = makeWrapper(true)
    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(true)
  })

  it('hides main dialog when visible=false', () => {
    const wrapper = makeWrapper(false)
    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false)
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
})
