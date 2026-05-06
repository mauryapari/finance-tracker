import type { AuthStorage, AuthHeaders } from '~/types'

const AUTH_KEY = 'finance_tracker_auth'

function readAuth(): AuthStorage | null {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null') } catch { return null }
}

export function getAuthHeaders(): AuthHeaders | Record<string, never> {
  const a = readAuth()
  if (!a?.token) return {}
  return { 'Authorization': `Bearer ${a.token}`, 'X-Expires-At': String(a.expiresAt) }
}

export function useAuth() {
  const isAuthenticated = computed(() => {
    const a = readAuth()
    return !!(a?.expiresAt && a.expiresAt > Date.now())
  })

  async function login(password: string): Promise<boolean> {
    try {
      const res = await $fetch<AuthStorage>('/api/auth/login', { method: 'POST', body: { password } })
      localStorage.setItem(AUTH_KEY, JSON.stringify(res))
      return true
    } catch { return false }
  }

  function logout(): void {
    localStorage.removeItem(AUTH_KEY)
    window.location.href = '/'
  }

  return { isAuthenticated, login, logout, getAuthHeaders }
}
