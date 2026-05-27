import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { useRoute } from 'vue-router'
import TabNav from '../../app/components/TabNav.vue'

// Mock vue-router so useRoute works outside a real router context
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ path: '/' })),
}))

const ALL_TABS = [
  { label: 'Dashboard',             to: '/' },
  { label: 'Open Positions',        to: '/open-positions' },
  { label: 'Closed Positions',      to: '/closed-positions' },
  { label: 'ETFs',                  to: '/etfs' },
  { label: 'Closed ETFs',           to: '/closed-etfs' },
  { label: 'Commodity ETFs',        to: '/commodity-etfs' },
  { label: 'Closed Commodity ETFs', to: '/closed-commodity-etfs' },
  { label: 'CAGR Tracker',         to: '/cagr' },
  { label: 'Commodity CAGR',        to: '/commodity-cagr' },
  { label: 'Budget',                to: '/budget' },
  { label: '👁 Watchlist',          to: '/watchlist' },
]

// NuxtLink stub that renders an <a> so we can inspect classes and text
const NuxtLinkStub = {
  props: ['to'],
  template: '<a :href="to" v-bind="$attrs"><slot /></a>',
}

function makeWrapper(path = '/') {
  vi.mocked(useRoute).mockReturnValue({ path })
  return mount(TabNav, {
    global: { stubs: { NuxtLink: NuxtLinkStub } },
  })
}

describe('TabNav — renders all tabs', () => {
  it('renders 11 tab links', () => {
    const w = makeWrapper()
    expect(w.findAll('a')).toHaveLength(11)
  })

  it.each(ALL_TABS)('renders "$label" tab', ({ label }) => {
    const w = makeWrapper()
    expect(w.text()).toContain(label)
  })

  it.each(ALL_TABS)('tab "$label" href points to $to', ({ label, to }) => {
    const w = makeWrapper()
    const link = w.findAll('a').find(a => a.text() === label)
    expect(link?.attributes('href')).toBe(to)
  })
})

describe('TabNav — active tab styling', () => {
  it('applies active border class to the current route tab', () => {
    const w = makeWrapper('/')
    const dashboardLink = w.findAll('a').find(a => a.text() === 'Dashboard')
    expect(dashboardLink?.classes()).toContain('border-blue-500')
  })

  it('applies active text class to the current route tab', () => {
    const w = makeWrapper('/etfs')
    const etfLink = w.findAll('a').find(a => a.text() === 'ETFs')
    expect(etfLink?.classes()).toContain('text-blue-600')
  })

  it('does not apply active class to non-current tabs', () => {
    const w = makeWrapper('/')
    const etfLink = w.findAll('a').find(a => a.text() === 'ETFs')
    expect(etfLink?.classes()).not.toContain('border-blue-500')
    expect(etfLink?.classes()).toContain('border-transparent')
  })

  it('only one tab has the active class at a time', () => {
    const w = makeWrapper('/cagr')
    const activeLinks = w.findAll('a').filter(a => a.classes().includes('border-blue-500'))
    expect(activeLinks).toHaveLength(1)
  })

  it('sets correct active tab for /closed-positions route', () => {
    const w = makeWrapper('/closed-positions')
    const link = w.findAll('a').find(a => a.text() === 'Closed Positions')
    expect(link?.classes()).toContain('border-blue-500')
  })
})
