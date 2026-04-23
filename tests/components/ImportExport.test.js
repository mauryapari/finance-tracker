import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ImportExport from '../../app/components/ImportExport.vue'

// ---- stubs & mocks ---------------------------------------------------------

// Stub PrimeVue Button — renders a real <button> with the label text so @click attrs forward
const ButtonStub = { props: ['label'], template: '<button v-bind="$attrs">{{ label }}</button>', inheritAttrs: false }

// Make FileReader synchronous so we don't need flushPromises gymnastics
let fakeFileContent = ''
vi.stubGlobal('FileReader', class {
  readAsText(_file) {
    this.onload?.({ target: { result: fakeFileContent } })
  }
})

let pinia

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  Object.defineProperty(globalThis, 'window', { value: globalThis, writable: true, configurable: true })
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

function makeWrapper() {
  return mount(ImportExport, {
    global: {
      plugins: [pinia],
      stubs: { Button: ButtonStub },
    },
  })
}

// ---- helpers ----------------------------------------------------------------

function triggerImport(wrapper, content) {
  fakeFileContent = content
  const input = wrapper.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', {
    value: [new File([content], 'test.json', { type: 'application/json' })],
    configurable: true,
  })
  return input.trigger('change')
}

// ---- tests ------------------------------------------------------------------

describe('ImportExport — layout', () => {
  it('shows today\'s date in the toolbar', () => {
    const w = makeWrapper()
    // today in en-IN format contains a 4-digit year
    expect(w.text()).toMatch(/\d{4}/)
  })

  it('renders Export and Import labels', () => {
    const w = makeWrapper()
    expect(w.text()).toContain('Export')
    expect(w.text()).toContain('Import')
  })

  it('hides the flash message by default', () => {
    const w = makeWrapper()
    const span = w.find('span[class*="text-"]')
    // The date span is present; the flash span should not be rendered (v-if="message")
    expect(w.findAll('span').filter(s => s.text().includes('Import') || s.text().includes('success'))).toHaveLength(0)
  })
})

describe('ImportExport — exportData', () => {
  it('calls URL.createObjectURL', async () => {
    const w = makeWrapper()
    const exportBtn = w.findAll('button').find(b => b.text() === 'Export')
    await exportBtn?.trigger('click')
    expect(URL.createObjectURL).toHaveBeenCalledOnce()
  })

  it('calls URL.revokeObjectURL after creating it', async () => {
    const w = makeWrapper()
    const exportBtn = w.findAll('button').find(b => b.text() === 'Export')
    await exportBtn?.trigger('click')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url')
  })

  it('creates a Blob from the store data', async () => {
    const BlobSpy = vi.spyOn(globalThis, 'Blob')
    const w = makeWrapper()
    const exportBtn = w.findAll('button').find(b => b.text() === 'Export')
    await exportBtn?.trigger('click')
    expect(BlobSpy).toHaveBeenCalled()
    const blobArgs = BlobSpy.mock.calls[0]
    const jsonStr = blobArgs[0][0]
    const parsed = JSON.parse(jsonStr)
    expect(parsed).toHaveProperty('version')
    expect(parsed).toHaveProperty('tables')
  })
})

describe('ImportExport — importData success', () => {
  it('calls store.importAll with parsed data', async () => {
    const payload = JSON.stringify({
      version: 1,
      tables: {
        openPositions: [{ id: 'x', stock: 'TCS' }],
        closedPositions: [], etfs: [], closedEtfs: [],
        commodityEtfs: [], closedCommodityEtfs: [],
        cagrEntries: [], commodityCagrEntries: [],
      },
    })
    const w = makeWrapper()
    await triggerImport(w, payload)
    const { useDataStore } = await import('../../app/stores/data.js')
    const store = useDataStore()
    expect(store.tables.openPositions[0].stock).toBe('TCS')
  })

  it('shows a success flash message', async () => {
    const payload = JSON.stringify({ version: 1, tables: {} })
    const w = makeWrapper()
    await triggerImport(w, payload)
    await flushPromises()
    expect(w.text()).toContain('Imported successfully')
  })

  it('flash message has green styling', async () => {
    const payload = JSON.stringify({ version: 1, tables: {} })
    const w = makeWrapper()
    await triggerImport(w, payload)
    await flushPromises()
    const flashSpan = w.findAll('span').find(s => s.text().includes('Imported'))
    expect(flashSpan?.classes().join(' ')).toContain('green')
  })

  it('clears the flash message after 3 seconds', async () => {
    vi.useFakeTimers()
    const payload = JSON.stringify({ version: 1, tables: {} })
    const w = makeWrapper()
    await triggerImport(w, payload)
    await flushPromises()
    expect(w.text()).toContain('Imported successfully')
    vi.advanceTimersByTime(3100)
    await flushPromises()
    expect(w.text()).not.toContain('Imported successfully')
  })
})

describe('ImportExport — importData error', () => {
  it('shows an error flash for invalid JSON', async () => {
    const w = makeWrapper()
    await triggerImport(w, 'not-valid-json{{{')
    await flushPromises()
    const flashSpan = w.findAll('span').find(s => s.text() !== '' && !s.text().match(/^\d/))
    expect(flashSpan?.classes().join(' ')).toContain('red')
  })

  it('shows an error flash when importAll throws', async () => {
    // { wrong: true } — missing version/tables → store throws
    const w = makeWrapper()
    await triggerImport(w, JSON.stringify({ wrong: true }))
    await flushPromises()
    const flashSpan = w.findAll('span').find(s => s.text() !== '' && !s.text().match(/^\d/))
    expect(flashSpan?.classes().join(' ')).toContain('red')
  })
})
