import { describe, it, expect, beforeEach, vi } from 'vitest'

// Reset the module between every test so the module-level `isDark` singleton
// starts fresh (avoids bleed between toggle/init tests).
beforeEach(async () => {
  vi.resetModules()
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

async function fresh() {
  const { useTheme } = await import('../app/composables/useTheme.js')
  return useTheme()
}

describe('init', () => {
  it('sets isDark to false when no theme in localStorage', async () => {
    const { isDark, init } = await fresh()
    init()
    expect(isDark.value).toBe(false)
  })

  it('sets isDark to true when theme=dark in localStorage', async () => {
    localStorage.setItem('theme', 'dark')
    const { isDark, init } = await fresh()
    init()
    expect(isDark.value).toBe(true)
  })

  it('adds "dark" class to <html> when theme=dark', async () => {
    localStorage.setItem('theme', 'dark')
    const { init } = await fresh()
    init()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('does not add "dark" class when theme=light', async () => {
    localStorage.setItem('theme', 'light')
    const { init } = await fresh()
    init()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})

describe('toggle', () => {
  it('switches isDark from false to true', async () => {
    const { isDark, init, toggle } = await fresh()
    init()
    toggle()
    expect(isDark.value).toBe(true)
  })

  it('switches isDark from true to false', async () => {
    localStorage.setItem('theme', 'dark')
    const { isDark, init, toggle } = await fresh()
    init()
    toggle()
    expect(isDark.value).toBe(false)
  })

  it('persists "dark" to localStorage after toggling on', async () => {
    const { init, toggle } = await fresh()
    init()
    toggle()
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('persists "light" to localStorage after toggling off', async () => {
    localStorage.setItem('theme', 'dark')
    const { init, toggle } = await fresh()
    init()
    toggle()
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('adds "dark" class on toggle to dark', async () => {
    const { init, toggle } = await fresh()
    init()
    toggle()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes "dark" class on toggle to light', async () => {
    localStorage.setItem('theme', 'dark')
    const { init, toggle } = await fresh()
    init()
    toggle()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
