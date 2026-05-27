import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// Stub child components used inside WatchlistCard
const ChecklistSectionStub = {
  props: ['title', 'items', 'color'],
  template: '<div data-testid="checklist-section">{{ title }}</div>',
}

import WatchlistCard from '../../app/components/WatchlistCard.vue'

const MOCK_ENTRY = {
  id: 'abc-123',
  stock: 'RELIANCE',
  stockExchange: 'NSE',
  signal: 'BUY',
  score: 80,
  lastUpdated: '2026-05-01',
  notes: 'Strong fundamentals',
  vitepressUrl: 'https://example.com/reliance',
  buyConditions: ['RSI < 40', 'Earnings growth'],
  sellConditions: ['Breaks 200 DMA'],
  holdConditions: ['Wait for Q2 results'],
}

function makeWrapper(entry = MOCK_ENTRY) {
  return mount(WatchlistCard, {
    props: { entry },
    global: {
      stubs: {
        ChecklistSection: ChecklistSectionStub,
      },
    },
  })
}

describe('WatchlistCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders stock name', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('RELIANCE')
  })

  it('renders exchange badge', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('NSE')
  })

  it('renders signal badge with text and icon', () => {
    const wrapper = makeWrapper()
    const badge = wrapper.find('[data-testid="signal-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toContain('BUY')
    expect(badge.text()).toContain('▲')
  })

  it('renders score', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('80/100')
  })

  it('renders notes', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('Strong fundamentals')
  })

  it('shows analysis link when vitepressUrl is set', () => {
    const wrapper = makeWrapper()
    const link = wrapper.find('[data-testid="analysis-link"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('https://example.com/reliance')
  })

  it('hides analysis link when no vitepressUrl', () => {
    const wrapper = makeWrapper({ ...MOCK_ENTRY, vitepressUrl: undefined })
    expect(wrapper.find('[data-testid="analysis-link"]').exists()).toBe(false)
  })

  it('emits edit event on edit button click', async () => {
    const wrapper = makeWrapper()
    await wrapper.find('[data-testid="edit-btn"]').trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')[0][0]).toMatchObject({ id: 'abc-123' })
  })

  it('emits delete event on delete button click', async () => {
    const wrapper = makeWrapper()
    await wrapper.find('[data-testid="delete-btn"]').trigger('click')
    expect(wrapper.emitted('delete')).toBeTruthy()
  })

  it('checklist panel hidden by default', () => {
    const wrapper = makeWrapper()
    expect(wrapper.find('[data-testid="checklist-panel"]').exists()).toBe(false)
  })

  it('expands checklist on expand button click', async () => {
    const wrapper = makeWrapper()
    await wrapper.find('[data-testid="expand-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="checklist-panel"]').exists()).toBe(true)
  })

  it('SELL signal gets red badge class', () => {
    const wrapper = makeWrapper({ ...MOCK_ENTRY, signal: 'SELL' })
    const badge = wrapper.find('[data-testid="signal-badge"]')
    expect(badge.classes().join(' ')).toMatch(/red/)
    expect(badge.text()).toContain('▼')
  })

  it('HOLD signal shows pause icon', () => {
    const wrapper = makeWrapper({ ...MOCK_ENTRY, signal: 'HOLD' })
    const badge = wrapper.find('[data-testid="signal-badge"]')
    expect(badge.text()).toContain('⏸')
  })
})
