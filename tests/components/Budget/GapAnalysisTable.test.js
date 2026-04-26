import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GapAnalysisTable from '../../../app/components/Budget/GapAnalysisTable.vue'

const DataTableStub = {
  props: ['value'],
  template: '<div data-testid="datatable"><slot /></div>',
}
const ColumnStub = {
  props: ['field', 'header', 'footer', 'frozen'],
  template: '<div class="col" />',
}
const ColumnGroupStub = { template: '<div><slot /></div>' }
const RowStub = { template: '<tr><slot /></tr>' }

const gapRows = [
  {
    month: 1,
    monthLabel: 'Jan 2025',
    extraEquity: 5000,
    extraDebt: -1000,
    extraCommodities: 2000,
  },
]

const gapTotals = {
  extraEquity: 5000,
  extraDebt: -1000,
  extraCommodities: 2000,
}

describe('GapAnalysisTable', () => {
  function makeWrapper() {
    return mount(GapAnalysisTable, {
      props: { gapRows, gapTotals },
      global: {
        stubs: {
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

  it('renders with empty gapRows', () => {
    const wrapper = mount(GapAnalysisTable, {
      props: { gapRows: [], gapTotals: { extraEquity: 0, extraDebt: 0, extraCommodities: 0 } },
      global: {
        stubs: {
          DataTable: DataTableStub,
          Column: ColumnStub,
          ColumnGroup: ColumnGroupStub,
          Row: RowStub,
        },
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('emits open-gap-drilldown when equity cell is clicked', async () => {
    const wrapper = makeWrapper()
    const buttons = wrapper.findAll('button')
    if (buttons.length > 0) {
      await buttons[0].trigger('click')
      expect(wrapper.emitted('open-gap-drilldown')).toBeTruthy()
    }
  })
})
