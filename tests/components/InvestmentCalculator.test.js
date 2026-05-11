import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import InvestmentCalculator from '../../app/components/InvestmentCalculator.vue'
import { useDataStore } from '../../app/stores/data'

const InputNumberStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<input type="number" :value="modelValue" @input="$emit(\'update:modelValue\', +$event.target.value)" data-testid="calc-amount" />',
}

const SelectStub = {
  props: ['modelValue', 'options', 'optionLabel', 'optionValue'],
  emits: ['update:modelValue'],
  template: `
    <select :value="modelValue" @change="$emit('update:modelValue', $event.target.value)" data-testid="calc-portfolio">
      <option v-for="o in options" :key="o[optionValue]" :value="o[optionValue]">{{ o[optionLabel] }}</option>
    </select>
  `,
}

const globalStubs = { InputNumber: InputNumberStub, Select: SelectStub }

function makeStock(overrides = {}) {
  return {
    id: 'p1', stock: 'TCS', buyDate: '2023-01-01', buyPrice: 2500,
    qty: 10, cmp: 3000, peakPrice: 3200, targetPrice: 3500,
    stockExchange: 'NSE', strategyName: '', description: '',
    ...overrides,
  }
}

function makeCommodity(overrides = {}) {
  return {
    id: 'c1', stock: 'GOLDBEES', type: 'Gold', buyDate: '2023-01-01',
    buyPrice: 50, qty: 100, cmp: 60, stockExchange: 'NSE',
    ...overrides,
  }
}

describe('InvestmentCalculator', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useDataStore()
  })

  function makeWrapper() {
    return mount(InvestmentCalculator, { global: { stubs: globalStubs } })
  }

  it('renders the title', () => {
    expect(makeWrapper().text()).toContain('Investment Calculator')
  })

  it('renders amount and portfolio inputs', () => {
    const w = makeWrapper()
    expect(w.find('[data-testid="calc-amount"]').exists()).toBe(true)
    expect(w.find('[data-testid="calc-portfolio"]').exists()).toBe(true)
  })

  it('shows no-prices message when portfolio has no live prices', () => {
    expect(makeWrapper().find('[data-testid="no-prices"]').exists()).toBe(true)
  })

  it('hides result block when amount is empty', async () => {
    store.tables.openPositions = [makeStock()]
    const w = makeWrapper()
    expect(w.find('[data-testid="calc-result"]').exists()).toBe(false)
  })

  it('shows correct current-pct and after-pct for stock portfolio', async () => {
    // portfolio value = 3000 * 10 = 30000
    store.tables.openPositions = [makeStock({ cmp: 3000, qty: 10 })]
    const w = makeWrapper()

    await w.find('[data-testid="calc-amount"]').setValue(3000)
    await nextTick()

    // current pct: 3000 / 30000 = 10%
    expect(w.find('[data-testid="current-pct"]').text()).toContain('10.00%')
    // after pct: 3000 / (30000 + 3000) ≈ 9.09%
    expect(w.find('[data-testid="after-pct"]').text()).toContain('9.09%')
  })

  it('combines openPositions and etfs for stock portfolio total', async () => {
    // openPositions: 3000 * 10 = 30000, etfs: 200 * 50 = 10000 → total 40000
    store.tables.openPositions = [makeStock({ cmp: 3000, qty: 10 })]
    store.tables.etfs = [{ id: 'e1', stock: 'NIFTYBEES', type: 'Index', buyDate: '2023-01-01', buyPrice: 180, qty: 50, cmp: 200, target: 250, stockExchange: 'NSE' }]
    const w = makeWrapper()

    await w.find('[data-testid="calc-amount"]').setValue(4000)
    await nextTick()

    // current pct: 4000 / 40000 = 10%
    expect(w.find('[data-testid="current-pct"]').text()).toContain('10.00%')
  })

  it('shows correct percentages for commodity portfolio', async () => {
    // commodity value = 60 * 100 = 6000
    store.tables.commodityEtfs = [makeCommodity({ cmp: 60, qty: 100 })]
    const w = makeWrapper()

    await w.find('[data-testid="calc-portfolio"]').setValue('commodity')
    await nextTick()
    await w.find('[data-testid="calc-amount"]').setValue(600)
    await nextTick()

    // current pct: 600 / 6000 = 10%
    expect(w.find('[data-testid="current-pct"]').text()).toContain('10.00%')
  })

  it('shows combined total for "total" portfolio option', async () => {
    // stock: 3000 * 10 = 30000, commodity: 60 * 100 = 6000 → total 36000
    store.tables.openPositions = [makeStock({ cmp: 3000, qty: 10 })]
    store.tables.commodityEtfs = [makeCommodity({ cmp: 60, qty: 100 })]
    const w = makeWrapper()

    await w.find('[data-testid="calc-portfolio"]').setValue('total')
    await nextTick()
    await w.find('[data-testid="calc-amount"]').setValue(3600)
    await nextTick()

    // current pct: 3600 / 36000 = 10%
    expect(w.find('[data-testid="current-pct"]').text()).toContain('10.00%')
  })

  it('hides result when portfolioValue is 0 even if amount is set', async () => {
    // no positions → no live prices
    const w = makeWrapper()
    await w.find('[data-testid="calc-amount"]').setValue(5000)
    await nextTick()
    expect(w.find('[data-testid="calc-result"]').exists()).toBe(false)
    expect(w.find('[data-testid="no-prices"]').exists()).toBe(true)
  })
})
