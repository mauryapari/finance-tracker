import { inject, ref } from 'vue'
import type { InjectionKey, Ref } from 'vue'

export interface CmpRefresh {
  refreshPrices: () => Promise<void>
  isRefreshing: Ref<boolean>
}

export const CMP_REFRESH_KEY: InjectionKey<CmpRefresh> = Symbol('cmpRefresh')

const _noop: CmpRefresh = {
  refreshPrices: async () => {},
  isRefreshing: ref(false),
}

export function useCmpRefresh(): CmpRefresh {
  return inject(CMP_REFRESH_KEY, _noop)
}
