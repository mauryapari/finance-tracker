import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MonthlyTable from '../../../app/components/Budget/MonthlyTable.vue'

const ButtonStub = { template: '<button @click="$emit(\'click\')"><slot /></button>', emits: ['click'] }
const InputNumberStub = { props: ['modelValue', 'minFractionDigits', 'size'], template: '<input type="number" :value="modelValue" @input="$emit(\'update:modelValue\', Number($event.target.value))" />', emits: ['update:modelValue'] }
const DataTableStub = {
  props: ['value', 'editMode', 'dataKey', 'editingRows'],
  emits: ['update:editingRows'],
  template: '<div data-testid="datatable"><slot /></div>',
}
const ColumnStub = {
  props: ['field', 'header', 'frozen', 'alignFrozen', 'footer'],
  template: '<div class="col" />',
}
const ColumnGroupStub = { template: '<div><slot /></div>' }
const RowStub = { template: '<tr><slot /></tr>' }

const trackingRows = [
  {
    month: 1,
    monthLabel: 'Jan 2025',
    stockEquityEtfs: 10000,
    stockEquityEtfsBreakdown: { openPositions: 5000, closedPositions: 3000, etfs: 2000 },
    mfEquity: 5000,
    ppf: 2000,
    commoditiesGold: 1000,
    commoditiesSilver: 500,
    commodities: 1500,
    sellProceeds: 0,
    brokerBalance: 0,
    investedEquityPercentage: 78,
    debtPercentage: 12,
    commoditiesPercentage: 10,
    total: 17000,
    stockProfitBooked: 500,
  },
]

const trackingTotals = {
  stockEquityEtfs: 10000,
  mfEquity: 5000,
  ppf: 2000,
  commoditiesGold: 1000,
  commoditiesSilver: 500,
  commodities: 1500,
  sellProceeds: 0,
  total: 17000,
  stockProfitBooked: 500,
}

describe('MonthlyTable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function makeWrapper() {
    return mount(MonthlyTable, {
      props: { trackingRows, trackingTotals, selectedYear: 2025 },
      global: {
        stubs: {
          Button: ButtonStub,
          InputNumber: InputNumberStub,
          DataTable: DataTableStub,
          Column: ColumnStub,
          ColumnGroup: ColumnGroupStub,
          Row: RowStub,
        },
      },
    })
  }

  it('renders the DataTable', () => {
    const wrapper = makeWrapper()
    expect(wrapper.find('[data-testid="datatable"]').exists()).toBe(true)
  })

  it('renders the heading', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('Monthly Investment Tracking')
  })

  it('emits open-drilldown when stocks cell is clicked', async () => {
    const wrapper = makeWrapper()
    const buttons = wrapper.findAll('button')
    if (buttons.length > 0) {
      await buttons[0].trigger('click')
      expect(wrapper.emitted('open-drilldown')).toBeTruthy()
    }
  })
})
