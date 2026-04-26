import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PositionModal from '../../app/components/PositionModal.vue'

const ButtonStub = { props: ['label', 'text'], template: '<button @click="$emit(\'click\')">{{ label }}<slot /></button>', emits: ['click'] }
const InputTextStub = { props: ['modelValue'], template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />', emits: ['update:modelValue'] }
const InputNumberStub = { props: ['modelValue'], template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />', emits: ['update:modelValue'] }
const SelectStub = { props: ['modelValue', 'options'], template: '<select :value="modelValue"><option v-for="o in options" :key="o" :value="o">{{ o }}</option></select>' }

const globalStubs = {
  Button: ButtonStub,
  InputText: InputTextStub,
  InputNumber: InputNumberStub,
  Select: SelectStub,
}

describe('PositionModal', () => {
  it('renders Add title for new position', () => {
    const wrapper = mount(PositionModal, {
      props: { type: 'etfs', initialData: null },
      global: { stubs: globalStubs },
    })
    expect(wrapper.text()).toContain('Add')
  })

  it('renders Edit title when initialData has id', () => {
    const wrapper = mount(PositionModal, {
      props: { type: 'etfs', initialData: { id: 'abc', type: 'NIFTY', stock: 'NIFTYBEES', buyDate: '2024-01-01', qty: 10, buyPrice: 200 } },
      global: { stubs: globalStubs },
    })
    expect(wrapper.text()).toContain('Edit')
  })

  it('emits close when Cancel is clicked', async () => {
    const wrapper = mount(PositionModal, {
      props: { type: 'etfs', initialData: null },
      global: { stubs: globalStubs },
    })
    const buttons = wrapper.findAll('button')
    const cancelBtn = buttons.find((b) => b.text() === 'Cancel')
    await cancelBtn.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits save with form data on Update click (edit mode)', async () => {
    const wrapper = mount(PositionModal, {
      props: {
        type: 'etfs',
        initialData: {
          id: 'xyz',
          type: 'NIFTY',
          stock: 'NIFTYBEES',
          buyDate: '2024-01-01',
          qty: 5,
          buyPrice: 300,
        },
      },
      global: { stubs: globalStubs },
    })
    const saveBtn = wrapper.findAll('button').find((b) => b.text().trim() === 'Update')
    await saveBtn.trigger('click')
    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.emitted('save')[0][0]).toMatchObject({ stock: 'NIFTYBEES' })
  })

  it('generates uuid for new row on Add click', async () => {
    const wrapper = mount(PositionModal, {
      props: { type: 'etfs', initialData: null },
      global: { stubs: globalStubs },
    })
    const saveBtn = wrapper.findAll('button').find((b) => b.text().trim() === 'Add')
    await saveBtn.trigger('click')
    const saved = wrapper.emitted('save')[0][0]
    expect(saved.id).toBeDefined()
    expect(typeof saved.id).toBe('string')
  })
})
