import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useDataStore } from '../../../app/stores/data.js'
import YearDialog from '../../../app/components/Budget/YearDialog.vue'

const ButtonStub = { props: ['label', 'text'], template: '<button @click="$emit(\'click\')">{{ label }}<slot /></button>', emits: ['click'] }
const InputNumberStub = { props: ['modelValue', 'disabled', 'useGrouping'], template: '<input type="number" :value="modelValue" @input="$emit(\'update:modelValue\', Number($event.target.value))" />', emits: ['update:modelValue'] }
const DialogStub = {
  props: ['visible', 'header', 'modal'],
  emits: ['update:visible'],
  template: '<div v-if="visible" data-testid="dialog"><div data-testid="dialog-header">{{ header }}</div><slot /><slot name="footer" /></div>',
}

describe('YearDialog', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useDataStore()
  })

  const globalStubs = {
    Button: ButtonStub,
    InputNumber: InputNumberStub,
    Dialog: DialogStub,
  }

  it('renders dialog when visible=true', () => {
    const wrapper = mount(YearDialog, {
      props: { visible: true, mode: 'add', budgetYear: null },
      global: { stubs: globalStubs },
    })
    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(true)
  })

  it('does not render dialog when visible=false', () => {
    const wrapper = mount(YearDialog, {
      props: { visible: false, mode: 'add', budgetYear: null },
      global: { stubs: globalStubs },
    })
    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false)
  })

  it('shows Add Budget Config header in add mode', () => {
    const wrapper = mount(YearDialog, {
      props: { visible: true, mode: 'add', budgetYear: null },
      global: { stubs: globalStubs },
    })
    expect(wrapper.find('[data-testid="dialog-header"]').text()).toContain('Add Budget Config')
  })

  it('shows Edit Budget Config header in edit mode', () => {
    const budgetYear = { id: '1', year: 2025, totalMonthly: 45000, equityPercentage: 0.78, debtPercentage: 0.12, commodityPercentage: 0.10, goldPercentage: 0.80, silverPercentage: 0.20 }
    const wrapper = mount(YearDialog, {
      props: { visible: true, mode: 'edit', budgetYear },
      global: { stubs: globalStubs },
    })
    expect(wrapper.find('[data-testid="dialog-header"]').text()).toContain('Edit Budget Config')
  })

  it('calls store.addRow on save in add mode', async () => {
    const wrapper = mount(YearDialog, {
      props: { visible: true, mode: 'add', budgetYear: null },
      global: { stubs: globalStubs },
    })
    const saveBtn = wrapper.findAll('button').find((b) => b.text() === 'Save')
    await saveBtn.trigger('click')
    expect(store.tables.budgetYears).toHaveLength(1)
  })

  it('emits close on Cancel click', async () => {
    const wrapper = mount(YearDialog, {
      props: { visible: true, mode: 'add', budgetYear: null },
      global: { stubs: globalStubs },
    })
    const cancelBtn = wrapper.findAll('button').find((b) => b.text() === 'Cancel')
    await cancelBtn.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits saved with the year on save', async () => {
    const wrapper = mount(YearDialog, {
      props: { visible: true, mode: 'add', budgetYear: null },
      global: { stubs: globalStubs },
    })
    const saveBtn = wrapper.findAll('button').find((b) => b.text() === 'Save')
    await saveBtn.trigger('click')
    expect(wrapper.emitted('saved')).toBeTruthy()
  })

  it('calls store.updateRow on save in edit mode', async () => {
    const budgetYear = { id: 'existing-id', year: 2025, totalMonthly: 45000, equityPercentage: 0.78, debtPercentage: 0.12, commodityPercentage: 0.10, goldPercentage: 0.80, silverPercentage: 0.20 }
    store.addRow('budgetYears', { ...budgetYear })
    const wrapper = mount(YearDialog, {
      props: { visible: true, mode: 'edit', budgetYear },
      global: { stubs: globalStubs },
    })
    const saveBtn = wrapper.findAll('button').find((b) => b.text() === 'Save')
    await saveBtn.trigger('click')
    expect(store.tables.budgetYears[0].id).toBe('existing-id')
  })
})
