<template>
  <div class="h-screen bg-gray-100 dark:bg-gray-900 flex flex-col overflow-hidden">
    <header class="bg-white dark:bg-gray-800 shadow-sm flex-shrink-0">
      <div class="max-w-screen-2xl mx-auto">
        <div class="flex items-center justify-between px-4 py-3">
          <h1 class="text-lg font-bold text-gray-800 dark:text-gray-100">Finance Tracker</h1>
          <div class="flex items-center gap-2">
            <span
              v-if="store.storageMode === 'remote'"
              class="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium"
              aria-label="Data synced to cloud"
            >
              <i class="pi pi-cloud" aria-hidden="true" />
              Cloud synced
            </span>
            <ImportExport v-if="isAuthenticated" />
            <Button
              :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
              text rounded size="small"
              :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
              @click="toggle"
            />
            <Button
              v-if="isAuthenticated"
              icon="pi pi-sign-out"
              text rounded size="small"
              aria-label="Sign out"
              @click="logout"
            />
            <NuxtLink v-else-if="route.path !== '/login'" to="/login">
              <Button icon="pi pi-user" label="Sign In" text size="small" />
            </NuxtLink>
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

<script setup lang="ts">
import { useTheme } from '~/composables/useTheme'
import { useDataStore } from '~/stores/data'
import { useAuth } from '~/composables/useAuth'
const { isDark, toggle } = useTheme()
const store = useDataStore()
const { isAuthenticated, logout } = useAuth()
const route = useRoute()
</script>
