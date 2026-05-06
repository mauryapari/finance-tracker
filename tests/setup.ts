import { vi } from 'vitest'

vi.stubGlobal('useRuntimeConfig', () => ({
  public: { storageKey: 'finance_tracker_data' },
}))
