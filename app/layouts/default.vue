<template>
  <div class="h-screen bg-gray-100 dark:bg-gray-900 flex flex-col overflow-hidden">
    <header class="bg-white dark:bg-gray-800 shadow-sm flex-shrink-0">
      <div class="max-w-screen-2xl mx-auto">
        <div class="flex items-center justify-between px-4 py-3">
          <h1 class="text-lg font-bold text-gray-800 dark:text-gray-100">Finance Tracker</h1>
          <div class="flex items-center gap-2">
            <ImportExport />
            <Button
              :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
              text rounded size="small"
              :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
              @click="toggle"
            />
          </div>
        </div>
        <TabNav />
      </div>
    </header>
    <main class="flex-1 overflow-hidden flex flex-col max-w-screen-2xl mx-auto w-full pb-4">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { useTheme } from '~/composables/useTheme'
const { isDark, toggle } = useTheme()
</script>
