<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useDataStore } from '~/stores/data'
import { useCmpPoller } from '~/composables/useCmpPoller'
import { useTheme } from '~/composables/useTheme'
import { useAuth } from '~/composables/useAuth'
const store = useDataStore()
const { init } = useTheme()
const { isAuthenticated } = useAuth()

onMounted(async () => {
  if (isAuthenticated.value) {
    await store.loadFromStorage()
  } else {
    const { default: demoData } = await import('~/assets/demo-data.json')
    store.loadDemoData(demoData as unknown as { tables: import('~/types').Tables })
  }
  init()
})
useCmpPoller()
</script>
