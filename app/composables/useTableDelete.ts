import { ref } from 'vue'
import type { Ref } from 'vue'
import type { TableKey } from '~/types'

interface StoreWithDelete {
  deleteRow(tableKey: TableKey, id: string): void
}

export function useTableDelete(store: StoreWithDelete, tableKey: TableKey) {
  const deleteDialog: Ref<boolean> = ref(false)
  const deletingId: Ref<string | null> = ref(null)

  function startDelete(id: string): void {
    deletingId.value = id
    deleteDialog.value = true
  }

  function confirmDelete(): void {
    if (deletingId.value) store.deleteRow(tableKey, deletingId.value)
    deleteDialog.value = false
    deletingId.value = null
  }

  return { deleteDialog, deletingId, startDelete, confirmDelete }
}
