<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 w-full max-w-sm">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">Sign In</h1>
      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <InputText
            id="password"
            v-model="password"
            type="password"
            class="w-full"
            placeholder="Enter password"
            aria-required="true"
            :aria-describedby="error ? 'login-error' : undefined"
            :disabled="loading"
          />
        </div>
        <p
          v-if="error"
          id="login-error"
          class="text-sm text-red-600 dark:text-red-400 mb-4"
          role="alert"
        >
          {{ error }}
        </p>
        <Button
          type="submit"
          label="Sign In"
          class="w-full"
          :loading="loading"
          :disabled="!password || loading"
        />
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

definePageMeta({ layout: 'auth' })

const { login } = useAuth()
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  const ok = await login(password.value)
  loading.value = false
  if (ok) {
    window.location.href = '/'
  } else {
    error.value = 'Invalid password. Please try again.'
    password.value = ''
  }
}
</script>
