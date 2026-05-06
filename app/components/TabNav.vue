<template>
  <div class="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
    <nav class="flex space-x-1 min-w-max px-2">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        :class="[
          'px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors no-underline',
          route.path === tab.to
            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500',
        ]"
      >
        {{ tab.label }}
      </NuxtLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";

const route = useRoute();

const tabs = [
  { to: "/", label: "Dashboard" },
  { to: "/open-positions", label: "Open Positions" },
  { to: "/closed-positions", label: "Closed Positions" },
  { to: "/etfs", label: "ETFs" },
  { to: "/closed-etfs", label: "Closed ETFs" },
  { to: "/commodity-etfs", label: "Commodity ETFs" },
  { to: "/closed-commodity-etfs", label: "Closed Commodity ETFs" },
  { to: "/cagr", label: "CAGR Tracker" },
  { to: "/commodity-cagr", label: "Commodity CAGR" },
  { to: "/budget", label: "Budget" },
];
</script>
