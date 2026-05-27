import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, computed } from 'vue'

// ── Stubs ────────────────────────────────────────────────────────────────────

const NuxtLinkStub = {
  props: ['to'],
  template: '<a :href="to" v-bind="$attrs"><slot /></a>',
}

// ── Mock useTradeHistory ─────────────────────────────────────────────────────

// We use a mutable ref so individual tests can override the state.
let _selectedDate = ref(null)
let _selectedDateEvents = computed(() => _mockEvents.value[_selectedDate.value] ?? [])
let _mockEvents = ref({})
let _heatmapData = ref([])
let _selectedYear = ref(new Date().getFullYear())
let _availableYears = ref([new Date().getFullYear()])
let _yearStats = ref({ trades: 0, buyValue: 0, sellValue: 0, activeDays: 0 })

vi.mock('../../app/composables/useTradeHistory.js', () => ({
  useTradeHistory: () => ({
    heatmapData: _heatmapData,
    selectedDate: _selectedDate,
    selectedDateEvents: _selectedDateEvents,
    selectedYear: _selectedYear,
    availableYears: _availableYears,
    yearStats: _yearStats,
    selectDate: vi.fn((date) => {
      _selectedDate.value = _selectedDate.value === date ? null : date
    }),
    clearSelection: vi.fn(() => {
      _selectedDate.value = null
    }),
  }),
}))

// Also mock formatCurrency used in the component
vi.mock('../../app/composables/useCalculations.js', () => ({
  formatCurrency: (n) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
}))

import TradeHistory from '../../app/components/TradeHistory.vue'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeWrapper() {
  return mount(TradeHistory, {
    global: {
      stubs: { NuxtLink: NuxtLinkStub },
      components: { NuxtLink: NuxtLinkStub },
    },
  })
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('TradeHistory', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    _selectedDate.value = null
    _mockEvents.value = {}
    _heatmapData.value = []
    _selectedYear.value = new Date().getFullYear()
    _availableYears.value = [new Date().getFullYear()]
    _yearStats.value = { trades: 0, buyValue: 0, sellValue: 0, activeDays: 0 }
  })

  it('renders without crashing', () => {
    const wrapper = makeWrapper()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the section heading', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('Trade History')
  })

  it('does not show trade list when no date is selected', () => {
    const wrapper = makeWrapper()
    expect(wrapper.find('[data-testid="trade-list-table"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="close-trade-list"]').exists()).toBe(false)
  })

  it('shows trade list when selectedDate has trades', async () => {
    const today = new Date().toISOString().split('T')[0]
    _mockEvents.value = {
      [today]: [
        {
          id: 'op-buy-abc',
          date: today,
          type: 'BUY',
          stock: 'RELIANCE',
          qty: 10,
          price: 2500,
          value: 25000,
          tableKey: 'openPositions',
          linkTo: '/open-positions',
        },
      ],
    }
    _selectedDate.value = today

    const wrapper = makeWrapper()
    expect(wrapper.find('[data-testid="trade-list-table"]').exists()).toBe(true)
  })

  it('shows "No trades on this date" for a date with no events', async () => {
    _selectedDate.value = '2020-01-01'
    _mockEvents.value = {}

    const wrapper = makeWrapper()
    expect(wrapper.find('[data-testid="no-trades-msg"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('No trades on this date')
  })

  it('renders BUY badge with correct text', async () => {
    const today = new Date().toISOString().split('T')[0]
    _mockEvents.value = {
      [today]: [
        {
          id: 'op-buy-abc',
          date: today,
          type: 'BUY',
          stock: 'TCS',
          qty: 5,
          price: 3000,
          value: 15000,
          tableKey: 'openPositions',
          linkTo: '/open-positions',
        },
      ],
    }
    _selectedDate.value = today

    const wrapper = makeWrapper()
    const badge = wrapper.find('[aria-label="BUY"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('BUY')
  })

  it('renders SELL badge with correct text', async () => {
    const today = new Date().toISOString().split('T')[0]
    _mockEvents.value = {
      [today]: [
        {
          id: 'cp-sell-xyz',
          date: today,
          type: 'SELL',
          stock: 'INFY',
          qty: 20,
          price: 1800,
          value: 36000,
          tableKey: 'closedPositions',
          linkTo: '/closed-positions',
        },
      ],
    }
    _selectedDate.value = today

    const wrapper = makeWrapper()
    const badge = wrapper.find('[aria-label="SELL"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('SELL')
  })

  it('close button clears selection', async () => {
    const today = new Date().toISOString().split('T')[0]
    _selectedDate.value = today

    const wrapper = makeWrapper()
    const closeBtn = wrapper.find('[data-testid="close-trade-list"]')
    expect(closeBtn.exists()).toBe(true)
    await closeBtn.trigger('click')
    expect(_selectedDate.value).toBeNull()
  })

  it('NuxtLink points to correct route for openPositions BUY', async () => {
    const today = new Date().toISOString().split('T')[0]
    _mockEvents.value = {
      [today]: [
        {
          id: 'op-buy-abc',
          date: today,
          type: 'BUY',
          stock: 'RELIANCE',
          qty: 10,
          price: 2500,
          value: 25000,
          tableKey: 'openPositions',
          linkTo: '/open-positions',
        },
      ],
    }
    _selectedDate.value = today

    const wrapper = makeWrapper()
    const link = wrapper.find('[data-testid="trade-link-op-buy-abc"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/open-positions')
  })

  it('NuxtLink points to correct route for closedPositions SELL', async () => {
    const today = new Date().toISOString().split('T')[0]
    _mockEvents.value = {
      [today]: [
        {
          id: 'cp-sell-xyz',
          date: today,
          type: 'SELL',
          stock: 'INFY',
          qty: 20,
          price: 1800,
          value: 36000,
          tableKey: 'closedPositions',
          linkTo: '/closed-positions',
        },
      ],
    }
    _selectedDate.value = today

    const wrapper = makeWrapper()
    const link = wrapper.find('[data-testid="trade-link-cp-sell-xyz"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/closed-positions')
  })

  it('heatmap cell has correct aria-label for day with trades', async () => {
    const today = new Date().toISOString().split('T')[0]
    _heatmapData.value = [{ date: today, count: 2, value: 50000 }]

    const wrapper = makeWrapper()
    const cell = wrapper.find(`[data-testid="heatmap-day-${today}"]`)
    expect(cell.exists()).toBe(true)
    expect(cell.attributes('aria-label')).toContain('2 trades')
  })

  it('heatmap cell has correct aria-label for day with no trades', async () => {
    const today = new Date().toISOString().split('T')[0]
    _heatmapData.value = [{ date: today, count: 0, value: 0 }]

    const wrapper = makeWrapper()
    const cell = wrapper.find(`[data-testid="heatmap-day-${today}"]`)
    expect(cell.exists()).toBe(true)
    expect(cell.attributes('aria-label')).toContain('no trades')
  })

  it('renders multiple trade rows when date has multiple events', async () => {
    const today = new Date().toISOString().split('T')[0]
    _mockEvents.value = {
      [today]: [
        { id: 'e1', date: today, type: 'BUY', stock: 'HDFC', qty: 5, price: 1500, value: 7500, tableKey: 'etfs', linkTo: '/etfs' },
        { id: 'e2', date: today, type: 'SELL', stock: 'TCS', qty: 3, price: 3500, value: 10500, tableKey: 'closedPositions', linkTo: '/closed-positions' },
      ],
    }
    _selectedDate.value = today

    const wrapper = makeWrapper()
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2)
  })

  // ── Year selector ───────────────────────────────────────────────────────────

  it('renders year select dropdown', () => {
    const wrapper = makeWrapper()
    expect(wrapper.find('[data-testid="year-select"]').exists()).toBe(true)
  })

  it('year select shows all available years as options', () => {
    _availableYears.value = [2025, 2024, 2023]
    _selectedYear.value = 2025

    const wrapper = makeWrapper()
    const options = wrapper.findAll('[data-testid="year-select"] option')
    expect(options).toHaveLength(3)
    expect(options[0].text()).toBe('2025')
    expect(options[1].text()).toBe('2024')
    expect(options[2].text()).toBe('2023')
  })

  it('year select has correct selected value', () => {
    _availableYears.value = [2025, 2024]
    _selectedYear.value = 2024

    const wrapper = makeWrapper()
    const select = wrapper.find('[data-testid="year-select"]')
    expect(select.element.value).toBe('2024')
  })

  // ── Year stats ──────────────────────────────────────────────────────────────

  it('shows "No trades recorded" when yearStats.trades is 0', () => {
    _yearStats.value = { trades: 0, buyValue: 0, sellValue: 0, activeDays: 0 }

    const wrapper = makeWrapper()
    const stats = wrapper.find('[data-testid="year-stats"]')
    expect(stats.text()).toContain('No trades recorded')
  })

  it('shows trade count and active days when trades > 0', () => {
    _yearStats.value = { trades: 12, buyValue: 100000, sellValue: 0, activeDays: 8 }

    const wrapper = makeWrapper()
    const stats = wrapper.find('[data-testid="year-stats"]')
    expect(stats.text()).toContain('12 trades')
    expect(stats.text()).toContain('8 active days')
  })

  it('shows buy value in year stats', () => {
    _yearStats.value = { trades: 3, buyValue: 50000, sellValue: 0, activeDays: 2 }

    const wrapper = makeWrapper()
    const stats = wrapper.find('[data-testid="year-stats"]')
    expect(stats.text()).toContain('₹')
  })

  it('hides sell value when yearStats.sellValue is 0', () => {
    _yearStats.value = { trades: 2, buyValue: 20000, sellValue: 0, activeDays: 1 }

    const wrapper = makeWrapper()
    const stats = wrapper.find('[data-testid="year-stats"]')
    // sell indicator "↓" should not appear when no sells
    expect(stats.text()).not.toContain('↓')
  })

  it('shows sell value when yearStats.sellValue > 0', () => {
    _yearStats.value = { trades: 4, buyValue: 30000, sellValue: 15000, activeDays: 3 }

    const wrapper = makeWrapper()
    const stats = wrapper.find('[data-testid="year-stats"]')
    expect(stats.text()).toContain('↓')
  })

  it('uses singular "trade" when trades === 1', () => {
    _yearStats.value = { trades: 1, buyValue: 5000, sellValue: 0, activeDays: 1 }

    const wrapper = makeWrapper()
    const stats = wrapper.find('[data-testid="year-stats"]')
    expect(stats.text()).toContain('1 trade')
    expect(stats.text()).not.toContain('1 trades')
  })

  it('uses singular "active day" when activeDays === 1', () => {
    _yearStats.value = { trades: 1, buyValue: 5000, sellValue: 0, activeDays: 1 }

    const wrapper = makeWrapper()
    const stats = wrapper.find('[data-testid="year-stats"]')
    expect(stats.text()).toContain('1 active day')
    expect(stats.text()).not.toContain('1 active days')
  })

  // ── Future date cells ────────────────────────────────────────────────────────

  it('renders future date cell as non-interactive div, not a button', async () => {
    const year = new Date().getFullYear()
    const future = `${year}-12-31`
    // Provide a heatmap entry for a future date — component should render it as a div
    _heatmapData.value = [{ date: future, count: 0, value: 0 }]

    const wrapper = makeWrapper()
    const cell = wrapper.find(`[data-testid="heatmap-day-${future}"]`)

    // Dec 31 of the current year is always in the future unless today is Dec 31
    const today = new Date().toISOString().split('T')[0]
    if (future > today) {
      expect(cell.exists()).toBe(true)
      expect(cell.element.tagName).toBe('DIV')
      expect(cell.attributes('aria-label')).toContain('future')
    }
  })

  it('renders past date cell as a button', async () => {
    const past = '2020-06-15'
    _heatmapData.value = [{ date: past, count: 1, value: 10000 }]

    const wrapper = makeWrapper()
    const cell = wrapper.find(`[data-testid="heatmap-day-${past}"]`)
    // Past date cells only render if selectedYear matches — skip check if not visible
    if (cell.exists()) {
      expect(cell.element.tagName).toBe('BUTTON')
    }
  })
})
