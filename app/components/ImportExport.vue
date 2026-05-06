<template>
  <div class="flex items-center gap-2">
    <span class="text-sm text-gray-500 dark:text-white font-medium tabular-nums pr-4">{{ today }}</span>
    <Button label="Export" icon="pi pi-download" size="small" outlined @click="exportData" />
    <label aria-label="Import JSON">
      <Button label="Import" icon="pi pi-upload" size="small" outlined as="span" class="cursor-pointer" />
      <input type="file" accept="application/json,.json" class="hidden" @change="importData" >
    </label>
    <span v-if="message" class="text-xs" :class="error ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'">{{ message }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDataStore } from '~/stores/data'

const store = useDataStore()
const message = ref('')
const error = ref(false)

const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

function flash(msg: string, isErr = false) {
  message.value = msg
  error.value = isErr
  setTimeout(() => { message.value = '' }, 3000)
}

function exportData() {
  const json = JSON.stringify({ version: store.version, tables: store.tables }, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'finance-tracker-backup.json'
  a.click()
  URL.revokeObjectURL(a.href)
}

function importData(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev: ProgressEvent<FileReader>) => {
    try {
      const data = JSON.parse(ev.target?.result as string)
      store.importAll(data)
      flash('Imported successfully')
    } catch (err) {
      flash((err as Error).message || 'Import failed', true)
    }
    input.value = ''
  }
  reader.readAsText(file)
}
</script>
