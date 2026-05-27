<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { provide } from 'vue'
import { useDataStore } from '~/stores/data'
import { useCmpPoller } from '~/composables/useCmpPoller'
import { useTheme } from '~/composables/useTheme'
import { useAuth } from '~/composables/useAuth'
import { CMP_REFRESH_KEY } from '~/composables/useCmpRefresh'

const store = useDataStore()
const { init } = useTheme()
const { isAuthenticated } = useAuth()

const { refreshPrices, isRefreshing } = useCmpPoller()
provide(CMP_REFRESH_KEY, { refreshPrices, isRefreshing })

onMounted(async () => {
  if (isAuthenticated.value) {
    await store.loadFromStorage()
  } else {
    const { default: demoData } = await import('~/assets/demo-data.json')
    store.loadDemoData(demoData as unknown as { tables: import('~/types').Tables })
  }
  init()
})
</script>
