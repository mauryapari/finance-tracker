import { ref } from 'vue'

export function useTableEditing() {
  const editingRows = ref([])
  const refreshKey  = ref(0)

  const isEditing = id => editingRows.value.some(r => r.id === id)

  function startEdit(data) {
    editingRows.value = [...editingRows.value, data]
  }

  function cancelEdit() {
    editingRows.value = []
    refreshKey.value++
  }

  return { editingRows, refreshKey, isEditing, startEdit, cancelEdit }
}
