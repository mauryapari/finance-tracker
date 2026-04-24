import { ref } from 'vue'

export function useTableDelete(store, tableKey) {
  const deleteDialog = ref(false)
  const deletingId   = ref(null)

  function startDelete(id) {
    deletingId.value  = id
    deleteDialog.value = true
  }

  function confirmDelete() {
    store.deleteRow(tableKey, deletingId.value)
    deleteDialog.value = false
    deletingId.value   = null
  }

  return { deleteDialog, deletingId, startDelete, confirmDelete }
}
