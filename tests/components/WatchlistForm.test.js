import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const DialogStub = {
  props: ['visible', 'header', 'modal'],
  template: '<div data-testid="dialog"><slot /><slot name="footer" /></div>',
  emits: ['update:visible'],
}
const ButtonStub = {
  props: ['label', 'disabled'],
  template: '<button :data-testid="$attrs[\'data-testid\']" :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>',
  emits: ['click'],
}
const InputTextStub = {
  props: ['modelValue', 'invalid'],
  template: '<input :data-testid="$attrs[\'data-testid\']" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  emits: ['update:modelValue'],
}
const InputNumberStub = {
  props: ['modelValue', 'min', 'max'],
  template: '<input type="number" :data-testid="$attrs[\'data-testid\']" :value="modelValue" @input="$emit(\'update:modelValue\', Number($event.target.value))" />',
  emits: ['update:modelValue'],
}
const SelectStub = {
  props: ['modelValue', 'options'],
  template: '<select :data-testid="$attrs[\'data-testid\']" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="o in options" :key="o" :value="o">{{ o }}</option></select>',
  emits: ['update:modelValue'],
}
const ConditionTextareaStub = {
  props: ['modelValue', 'label', 'testid'],
  template: '<textarea :data-testid="testid" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>',
  emits: ['update:modelValue'],
}

const globalStubs = {
  Dialog: DialogStub,
  Button: ButtonStub,
  InputText: InputTextStub,
  InputNumber: InputNumberStub,
  Select: SelectStub,
  ConditionTextarea: ConditionTextareaStub,
}

import WatchlistForm from '../../app/components/WatchlistForm.vue'

const MOCK_ENTRY = {
  id: 'xyz-456',
  stock: 'INFY',
  stockExchange: 'NSE',
  signal: 'BUY',
  score: 70,
  lastUpdated: '2026-04-01',
  notes: 'Tech leader',
  vitepressUrl: '',
  buyConditions: ['Strong revenue'],
  sellConditions: [],
  holdConditions: [],
}

function makeWrapper(entry = undefined) {
  return mount(WatchlistForm, {
    props: { entry },
    global: { stubs: globalStubs },
  })
}

describe('WatchlistForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders in add mode without entry', () => {
    const wrapper = makeWrapper()
    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="watchlist-form"]').exists()).toBe(true)
  })

  it('save button is disabled when stock is empty', () => {
    const wrapper = makeWrapper()
    const saveBtn = wrapper.find('[data-testid="save-btn"]')
    expect(saveBtn.attributes('disabled')).toBeDefined()
  })

  it('save button enabled after entering stock symbol', async () => {
    const wrapper = makeWrapper()
    const input = wrapper.find('[data-testid="input-stock"]')
    await input.setValue('RELIANCE')
    await wrapper.vm.$nextTick()
    const saveBtn = wrapper.find('[data-testid="save-btn"]')
    expect(saveBtn.attributes('disabled')).toBeUndefined()
  })

  it('emits cancel when cancel button clicked', async () => {
    const wrapper = makeWrapper()
    await wrapper.find('[data-testid="cancel-btn"]').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('emits save with correct data', async () => {
    const wrapper = makeWrapper()
    await wrapper.find('[data-testid="input-stock"]').setValue('TCS')
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-testid="save-btn"]').trigger('click')
    const emitted = wrapper.emitted('save')
    expect(emitted).toBeTruthy()
    const saved = emitted[0][0]
    expect(saved.stock).toBe('TCS')
    expect(saved.id).toBeTruthy()
  })

  it('populates form fields from existing entry', () => {
    const wrapper = makeWrapper(MOCK_ENTRY)
    const stockInput = wrapper.find('[data-testid="input-stock"]')
    expect(stockInput.element.value).toBe('INFY')
  })

  it('emits save with same id when editing', async () => {
    const wrapper = makeWrapper(MOCK_ENTRY)
    await wrapper.find('[data-testid="save-btn"]').trigger('click')
    const emitted = wrapper.emitted('save')
    expect(emitted).toBeTruthy()
    expect(emitted[0][0].id).toBe('xyz-456')
  })

  it('converts buy conditions textarea to array on save', async () => {
    const wrapper = makeWrapper()
    await wrapper.find('[data-testid="input-stock"]').setValue('WIPRO')
    const buyTextarea = wrapper.find('[data-testid="input-buy"]')
    await buyTextarea.setValue('RSI < 40\nStrong earnings')
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-testid="save-btn"]').trigger('click')
    const saved = wrapper.emitted('save')[0][0]
    expect(saved.buyConditions).toEqual(['RSI < 40', 'Strong earnings'])
  })

  it('uppercases stock symbol', async () => {
    const wrapper = makeWrapper()
    await wrapper.find('[data-testid="input-stock"]').setValue('reliance')
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-testid="save-btn"]').trigger('click')
    const saved = wrapper.emitted('save')[0][0]
    expect(saved.stock).toBe('RELIANCE')
  })
})
