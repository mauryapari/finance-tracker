import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SavePopup from '../../app/components/SavePopup.vue'

describe('SavePopup — save mode (default)', () => {
  it('shows Save and Cancel buttons', () => {
    const w = mount(SavePopup)
    expect(w.text()).toContain('Save')
    expect(w.text()).toContain('Cancel')
  })

  it('does NOT show the "Delete this row?" text', () => {
    const w = mount(SavePopup)
    expect(w.text()).not.toContain('Delete this row?')
  })

  it('emits "confirm" when Save is clicked', async () => {
    const w = mount(SavePopup)
    await w.find('button:first-of-type').trigger('click')
    expect(w.emitted('confirm')).toHaveLength(1)
  })

  it('emits "cancel" when Cancel is clicked', async () => {
    const w = mount(SavePopup)
    const buttons = w.findAll('button')
    await buttons[buttons.length - 1].trigger('click')
    expect(w.emitted('cancel')).toHaveLength(1)
  })
})

describe('SavePopup — delete mode', () => {
  it('shows "Delete this row?" text', () => {
    const w = mount(SavePopup, { props: { mode: 'delete' } })
    expect(w.text()).toContain('Delete this row?')
  })

  it('shows a Delete button', () => {
    const w = mount(SavePopup, { props: { mode: 'delete' } })
    expect(w.text()).toContain('Delete')
  })

  it('emits "confirm" when Delete is clicked', async () => {
    const w = mount(SavePopup, { props: { mode: 'delete' } })
    await w.find('button').trigger('click')
    expect(w.emitted('confirm')).toHaveLength(1)
  })

  it('emits "cancel" when Cancel is clicked', async () => {
    const w = mount(SavePopup, { props: { mode: 'delete' } })
    const buttons = w.findAll('button')
    await buttons[buttons.length - 1].trigger('click')
    expect(w.emitted('cancel')).toHaveLength(1)
  })
})
