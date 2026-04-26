import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfigCard from '../../../app/components/Budget/ConfigCard.vue'

const ButtonStub = { props: ['label', 'icon', 'size', 'text'], template: '<button @click="$emit(\'click\')">{{ label }}<slot /></button>', emits: ['click'] }

const mockBudgetYear = {
  id: '1',
  year: 2025,
  totalMonthly: 45000,
  equityPercentage: 0.78,
  debtPercentage: 0.12,
  commodityPercentage: 0.10,
  goldPercentage: 0.80,
  silverPercentage: 0.20,
}

describe('ConfigCard', () => {
  function makeWrapper(budgetYear = mockBudgetYear) {
    return mount(ConfigCard, {
      props: { budgetYear, selectedYear: 2025 },
      global: { stubs: { Button: ButtonStub } },
    })
  }

  it('renders monthly total', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('45,000')
  })

  it('renders equity percentage', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('78')
  })

  it('renders debt percentage', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('12')
  })

  it('renders commodity percentage', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('10')
  })

  it('emits edit when Edit button is clicked', async () => {
    const wrapper = makeWrapper()
    const editBtn = wrapper.findAll('button').find((b) => b.text().toLowerCase().includes('edit'))
    await editBtn.trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()
  })

  it('renders the selected year in the heading', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('2025')
  })
})
