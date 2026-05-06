import { ref } from 'vue'
import type { Ref } from 'vue'

export function useTableEditing<T extends { id: string }>() {
  const editingRows: Ref<T[]> = ref([])
  const refreshKey: Ref<number> = ref(0)

  const isEditing = (id: string): boolean => editingRows.value.some(r => r.id === id)

  function startEdit(data: T): void {
    editingRows.value = [...editingRows.value, data]
  }

  function cancelEdit(): void {
    editingRows.value = []
    refreshKey.value++
  }

  return { editingRows, refreshKey, isEditing, startEdit, cancelEdit }
}
