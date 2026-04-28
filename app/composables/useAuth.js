const AUTH_KEY = 'finance_tracker_auth'

function readAuth() {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null') } catch { return null }
}

export function getAuthHeaders() {
  const a = readAuth()
  if (!a?.token) return {}
  return { 'Authorization': `Bearer ${a.token}`, 'X-Expires-At': String(a.expiresAt) }
}

export function useAuth() {
  const isAuthenticated = computed(() => {
    const a = readAuth()
    return !!(a?.expiresAt > Date.now())
  })

  async function login(password) {
    try {
      const res = await $fetch('/api/auth/login', { method: 'POST', body: { password } })
      localStorage.setItem(AUTH_KEY, JSON.stringify(res))
      return true
    } catch { return false }
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY)
    window.location.href = '/'
  }

  return { isAuthenticated, login, logout, getAuthHeaders }
}
