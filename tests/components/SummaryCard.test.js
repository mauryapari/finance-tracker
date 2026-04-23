import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SummaryCard from '../../app/components/SummaryCard.vue'

function mkSummary(overrides = {}) {
  return {
    netValue: 100000,
    totalInvested: 80000,
    profit: 20000,
    profitPct: 25,
    ...overrides,
  }
}

describe('SummaryCard', () => {
  it('renders the title', () => {
    const w = mount(SummaryCard, { props: { title: 'Stock Portfolio', summary: mkSummary(), cagr: 12 } })
    expect(w.text()).toContain('Stock Portfolio')
  })

  it('renders Net Value with ₹ prefix', () => {
    const w = mount(SummaryCard, { props: { title: 'T', summary: mkSummary({ netValue: 100000 }), cagr: 0 } })
    expect(w.text()).toContain('₹')
    expect(w.text()).toContain('1,00,000') // en-IN locale
  })

  it('renders Invested value', () => {
    const w = mount(SummaryCard, { props: { title: 'T', summary: mkSummary({ totalInvested: 80000 }), cagr: 0 } })
    expect(w.text()).toContain('80,000')
  })

  it('renders profitPct formatted to 2 decimal places', () => {
    const w = mount(SummaryCard, { props: { title: 'T', summary: mkSummary({ profitPct: 25 }), cagr: 0 } })
    expect(w.text()).toContain('25.00%')
  })

  it('renders CAGR formatted to 2 decimal places', () => {
    const w = mount(SummaryCard, { props: { title: 'T', summary: mkSummary(), cagr: 18.5 } })
    expect(w.text()).toContain('18.50%')
  })

  it('applies green class when profit is positive', () => {
    const w = mount(SummaryCard, { props: { title: 'T', summary: mkSummary({ profit: 500 }), cagr: 0 } })
    const profitEl = w.findAll('p').find(p => p.text().includes('500'))
    expect(profitEl?.classes()).toContain('text-green-600')
  })

  it('applies red class when profit is negative', () => {
    const w = mount(SummaryCard, { props: { title: 'T', summary: mkSummary({ profit: -200, profitPct: -5 }), cagr: 0 } })
    const profitEl = w.findAll('p').find(p => p.text().includes('-'))
    expect(profitEl?.classes()).toContain('text-red-500')
  })

  it('applies green class when CAGR is positive', () => {
    const w = mount(SummaryCard, { props: { title: 'T', summary: mkSummary(), cagr: 10 } })
    const cagrEl = w.findAll('p').find(p => p.text().includes('10.00%'))
    expect(cagrEl?.classes()).toContain('text-green-600')
  })

  it('applies red class when CAGR is negative', () => {
    const w = mount(SummaryCard, { props: { title: 'T', summary: mkSummary(), cagr: -5 } })
    const cagrEl = w.findAll('p').find(p => p.text().includes('-5.00%'))
    expect(cagrEl?.classes()).toContain('text-red-500')
  })

  it('uses default props when none are provided', () => {
    const w = mount(SummaryCard)
    expect(w.text()).toContain('0.00%')
  })
})
