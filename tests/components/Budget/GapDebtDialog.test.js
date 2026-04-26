import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GapDebtDialog from '../../../app/components/Budget/GapDebtDialog.vue'

const DialogStub = {
  props: ['visible', 'header', 'modal'],
  emits: ['update:visible'],
  template: '<div v-if="visible" data-testid="dialog"><slot /></div>',
}

const gapRow = {
  month: 2,
  monthLabel: 'Feb 2025',
  budgetDebt: 5400,
  actualDebt: 4000,
  extraDebt: 1400,
}

describe('GapDebtDialog', () => {
  function makeWrapper(visible = true) {
    return mount(GapDebtDialog, {
      props: { visible, monthLabel: 'Feb 2025', gapRow },
      global: { stubs: { Dialog: DialogStub } },
    })
  }

  it('renders when visible=true', () => {
    expect(makeWrapper(true).find('[data-testid="dialog"]').exists()).toBe(true)
  })

  it('hides when visible=false', () => {
    expect(makeWrapper(false).find('[data-testid="dialog"]').exists()).toBe(false)
  })

  it('renders budget debt amount', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('5,400')
  })

  it('renders actual debt amount', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('4,000')
  })

  it('renders gap amount', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('1,400')
  })
})
