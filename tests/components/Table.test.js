import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Table from '../../app/components/Table.vue'

const ButtonStub = { template: '<button @click="$emit(\'click\')"><slot /></button>', emits: ['click'] }
const InputTextStub = { props: ['modelValue'], template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />', emits: ['update:modelValue'] }
const InputNumberStub = { props: ['modelValue'], template: '<input type="number" :value="modelValue" />' }
const SelectStub = { props: ['modelValue', 'options'], template: '<select />' }
const DataTableStub = { props: ['value', 'editMode', 'dataKey', 'editingRows'], emits: ['update:editingRows'], template: '<div data-testid="datatable"><slot /></div>' }
const ColumnStub = { props: ['field', 'header', 'frozen'], template: '<div class="col"><slot name="body" :data="{}" /><slot name="editor" :data="{}" :field="field" /></div>' }
const ColumnGroupStub = { template: '<div><slot /></div>' }
const RowStub = { template: '<tr><slot /></tr>' }
const DialogStub = { props: ['visible', 'header'], template: '<div v-if="visible" data-testid="dialog"><slot /><slot name="footer" /></div>' }

const globalStubs = {
  Button: ButtonStub,
  InputText: InputTextStub,
  InputNumber: InputNumberStub,
  Select: SelectStub,
  DataTable: DataTableStub,
  Column: ColumnStub,
  ColumnGroup: ColumnGroupStub,
  Row: RowStub,
  Dialog: DialogStub,
}

describe('Table', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders title for openPositions table', () => {
    const wrapper = mount(Table, {
      props: { tableKey: 'openPositions', title: 'Open Positions' },
      global: { stubs: globalStubs },
    })
    expect(wrapper.text()).toContain('Open Positions')
  })

  it('renders title for etfs table', () => {
    const wrapper = mount(Table, {
      props: { tableKey: 'etfs', title: 'ETFs' },
      global: { stubs: globalStubs },
    })
    expect(wrapper.text()).toContain('ETFs')
  })

  it('renders DataTable', () => {
    const wrapper = mount(Table, {
      props: { tableKey: 'openPositions', title: 'Open Positions' },
      global: { stubs: globalStubs },
    })
    expect(wrapper.find('[data-testid="datatable"]').exists()).toBe(true)
  })

  it('renders for closedPositions table', () => {
    const wrapper = mount(Table, {
      props: { tableKey: 'closedPositions', title: 'Closed Positions' },
      global: { stubs: globalStubs },
    })
    expect(wrapper.text()).toContain('Closed Positions')
  })

  it('renders for commodityEtfs table', () => {
    const wrapper = mount(Table, {
      props: { tableKey: 'commodityEtfs', title: 'Commodity ETFs' },
      global: { stubs: globalStubs },
    })
    expect(wrapper.text()).toContain('Commodity ETFs')
  })
})
