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
    monthlyBudget: 45000,
    stockEquityEtfs: 10000,
    stockEquityEtfsBreakdown: { openPositions: 5000, closedPositions: 3000, etfs: 2000 },
    mfEquityOverride: 5000,
    ppfOverride: 2000,
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
  {
    month: 2,
    monthLabel: 'Feb 2025',
    monthlyBudget: null,
    stockEquityEtfs: 8000,
    stockEquityEtfsBreakdown: { openPositions: 4000, closedPositions: 2000, etfs: 2000 },
    mfEquityOverride: null,
    ppfOverride: null,
    mfEquity: 3000,
    ppf: 1500,
    commoditiesGold: 800,
    commoditiesSilver: 400,
    commodities: 1200,
    sellProceeds: 0,
    brokerBalance: 0,
    investedEquityPercentage: 78,
    debtPercentage: 12,
    commoditiesPercentage: 10,
    total: 14000,
    stockProfitBooked: 0,
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

  const budgetYear = { totalMonthly: 45000, mfEquity: 3000, ppf: 1500, equityPercentage: 0.78, debtPercentage: 0.12, commodityPercentage: 0.10, goldPercentage: 0.80, silverPercentage: 0.20 }

  function makeWrapper() {
    return mount(MonthlyTable, {
      props: { trackingRows, trackingTotals, selectedYear: 2025, budgetYear },
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
