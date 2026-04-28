<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
      <div class="flex items-center justify-between p-4 border-b">
        <h3 class="font-semibold text-gray-800">{{ isEdit ? 'Edit' : 'Add' }} {{ typeLabel }}</h3>
        <Button icon="pi pi-times" aria-label="Close" variant="text" severity="secondary" rounded size="small" @click="$emit('close')" />
      </div>
      <div class="overflow-y-auto p-4 space-y-3">
        <div v-for="field in fields" :key="field.key" class="flex flex-col gap-1">
          <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ field.label }}</label>
          <select
v-if="field.type === 'select'" v-model="form[field.key]"
            class="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
          </select>
          <input
v-else v-model="form[field.key]"
            :type="field.type || 'text'"
            :placeholder="field.placeholder || ''"
            class="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
        </div>
      </div>
      <div class="p-4 border-t flex justify-end gap-2">
        <Button label="Cancel" variant="text" severity="secondary" @click="$emit('close')" />
        <Button :label="isEdit ? 'Update' : 'Add'" @click="handleSave" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'

const props = defineProps({
  type: { type: String, required: true },
  initialData: { type: Object, default: null }
})
const emit = defineEmits(['save', 'close'])

const isEdit = computed(() => !!props.initialData?.id)

const FIELD_CONFIGS = {
  etfs: [
    { key: 'type',          label: 'Type' },
    { key: 'stock',         label: 'Stock Symbol' },
    { key: 'stockExchange', label: 'Exchange', type: 'select', options: ['NSE', 'BSE'] },
    { key: 'buyDate',       label: 'Buy Date', type: 'date' },
    { key: 'buyPrice',      label: 'Buy Price', type: 'number' },
    { key: 'qty',           label: 'Qty', type: 'number' },
    { key: 'cmp',           label: 'CMP', type: 'number' },
    { key: 'target',        label: 'Target', type: 'number' },
  ],
  closedEtfs: [
    { key: 'type',      label: 'Type' },
    { key: 'stock',     label: 'Stock Symbol' },
    { key: 'buyDate',   label: 'Buy Date', type: 'date' },
    { key: 'buyRate',   label: 'Buy Rate', type: 'number' },
    { key: 'qty',       label: 'Qty', type: 'number' },
    { key: 'sellDate',  label: 'Sell Date', type: 'date' },
    { key: 'sellPrice', label: 'Sell Price', type: 'number' },
  ],
  commodityEtfs: [
    { key: 'type',          label: 'Type' },
    { key: 'stock',         label: 'Stock Symbol' },
    { key: 'stockExchange', label: 'Exchange', type: 'select', options: ['NSE', 'BSE'] },
    { key: 'buyDate',       label: 'Buy Date', type: 'date' },
    { key: 'buyPrice',      label: 'Buy Price', type: 'number' },
    { key: 'qty',           label: 'Qty', type: 'number' },
    { key: 'cmp',           label: 'CMP', type: 'number' },
  ],
  closedCommodityEtfs: [
    { key: 'stock',     label: 'Stock Symbol' },
    { key: 'buyDate',   label: 'Buy Date', type: 'date' },
    { key: 'buyRate',   label: 'Buy Rate', type: 'number' },
    { key: 'qty',       label: 'Qty', type: 'number' },
    { key: 'sellDate',  label: 'Sell Date', type: 'date' },
    { key: 'sellPrice', label: 'Sell Price', type: 'number' },
  ],
  cagrEntries: [
    { key: 'text',           label: 'Description' },
    { key: 'date',           label: 'Date', type: 'date' },
    { key: 'amount',         label: 'Amount', type: 'number' },
    { key: 'investmentOrOut', label: 'Type', type: 'select', options: ['Investment', 'Out'] },
  ],
  commodityCagrEntries: [
    { key: 'text',   label: 'Description' },
    { key: 'date',   label: 'Date', type: 'date' },
    { key: 'amount', label: 'Amount', type: 'number' },
  ],
}

const TYPE_LABELS = {
  etfs: 'ETF', closedEtfs: 'Closed ETF',
  commodityEtfs: 'Commodity ETF', closedCommodityEtfs: 'Closed Commodity ETF',
  cagrEntries: 'CAGR Entry', commodityCagrEntries: 'Commodity CAGR Entry',
}

const fields = computed(() => FIELD_CONFIGS[props.type] || [])
const typeLabel = computed(() => TYPE_LABELS[props.type] || props.type)

const form = ref(props.initialData ? { ...props.initialData } : {})

function handleSave() {
  const data = { ...form.value }
  if (!data.id) data.id = uuidv4()
  // coerce numeric fields
  for (const f of fields.value) {
    if (f.type === 'number' && data[f.key] !== undefined) {
      data[f.key] = parseFloat(data[f.key]) || 0
    }
  }
  emit('save', data)
}
</script>
