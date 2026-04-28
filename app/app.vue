<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
import { useDataStore } from '~/stores/data'
import { useCmpPoller } from '~/composables/useCmpPoller'
import { useTheme } from '~/composables/useTheme'
import { useAuth } from '~/composables/useAuth'
import demoData from '~/assets/demo-data.json'

const store = useDataStore()
const { init } = useTheme()
const { isAuthenticated } = useAuth()

onMounted(async () => {
  if (isAuthenticated.value) {
    await store.loadFromStorage()
  } else {
    store.loadDemoData(demoData)
  }
  init()
})
useCmpPoller()
</script>
