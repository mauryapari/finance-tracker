import { ref } from 'vue'

const isDark = ref(false)

export function useTheme() {
  function init() {
    isDark.value = localStorage.getItem('theme') === 'dark'
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  function toggle() {
    isDark.value = !isDark.value
    document.documentElement.classList.toggle('dark', isDark.value)
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  }

  return { isDark, init, toggle }
}
