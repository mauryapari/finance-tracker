import { ref } from 'vue'
import type { Ref } from 'vue'

const isDark: Ref<boolean> = ref(false)

export function useTheme() {
  function init(): void {
    isDark.value = localStorage.getItem('theme') === 'dark'
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  function toggle(): void {
    isDark.value = !isDark.value
    document.documentElement.classList.toggle('dark', isDark.value)
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  }

  return { isDark, init, toggle }
}
