<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
import { useDataStore } from '~/stores/data'
import { useCmpPoller } from '~/composables/useCmpPoller'
import { useTheme } from '~/composables/useTheme'

const store = useDataStore()
const { init } = useTheme()
onMounted(() => {
  store.loadFromStorage()
  init()
})
useCmpPoller()
</script>
