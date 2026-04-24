<template>
  <div class="flex flex-col h-full px-4">
    <div class="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
      <h3 class="font-semibold text-gray-700 dark:text-gray-200 text-base">{{ title }}</h3>
      <Button @click="addRow" size="small" icon="pi pi-plus" label="Add Row" />
    </div>

    <DataTable
      :value="enrichedRows"
      editMode="row"
      dataKey="id"
      v-model:editingRows="editingRows"
      showGridlines
      scrollable
      scrollHeight="flex"
      removableSort
      size="large"
      class="text-sm flex-1"
    >
      <Column
        v-for="col in columns"
        :key="col.key"
        sortable
        :field="col.key"
        :header="col.label"
        :frozen="col.frozen ?? false"
        alignFrozen="left"
        style="min-width:7rem"
      >
        <template #body="{ data }">
          <span :class="col.class?.(data)">
            {{ col.format ? col.format(data[col.key], data) : data[col.key] }}
          </span>
        </template>
        <template #editor="{ data }">
          <template v-if="fieldMap[col.key]">
            <Select
              v-if="fieldMap[col.key].type === 'select'"
              v-model="data[col.key]"
              :options="fieldMap[col.key].options"
              size="small"
              class="w-full"
            />
            <InputNumber
              v-else-if="fieldMap[col.key].type === 'number'"
              v-model="data[col.key]"
              :minFractionDigits="2"
              size="small"
              class="w-full"
            />
            <InputText
              v-else
              v-model="data[col.key]"
              :type="fieldMap[col.key].type || 'text'"
              size="small"
              class="w-full"
            />
          </template>
          <span v-else :class="col.class?.(data)">
            {{ col.format ? col.format(data[col.key], data) : data[col.key] }}
          </span>
        </template>
      </Column>

      <Column header="" style="width:8rem;text-align:center" frozen alignFrozen="right">
        <template #body="{ data }">
          <div class="flex gap-0.5 justify-center">
            <template v-if="isEditing(data.id)">
              <Button icon="pi pi-check" text rounded size="small" severity="success" @click="saveEdit(data)" />
              <Button icon="pi pi-times" text rounded size="small" severity="secondary" @click="cancelEdit()" />
            </template>
            <template v-else>
              <Button icon="pi pi-pencil" text rounded size="small" @click="startEdit(data)" />
              <Button v-if="tableKey === 'etfs' || tableKey === 'commodityEtfs'" icon="pi pi-sign-out" text rounded size="small" severity="warn" v-tooltip.top="'Close position'" @click="startClose(data)" />
              <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="startDelete(data.id)" />
            </template>
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Delete confirmation dialog -->
    <Dialog v-model:visible="deleteDialog" modal header="Confirm Delete" :style="{ width: '22rem' }">
      <p class="text-gray-600 dark:text-gray-300 mb-4">Delete this entry? This cannot be undone.</p>
      <template #footer>
        <Button label="Cancel" text @click="deleteDialog = false" />
        <Button label="Delete" severity="danger" @click="confirmDelete" />
      </template>
    </Dialog>

    <!-- Close ETF dialog -->
    <Dialog v-model:visible="closeDialog" modal header="Close Position" :style="{ width: '26rem' }">
      <div class="space-y-4 pt-1">
        <div class="grid grid-cols-2 gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm">
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Stock</p>
            <p class="font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">{{ closeForm.stock }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Available Qty</p>
            <p class="font-semibold">{{ closeForm.maxQty }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Buy Price</p>
            <p class="font-semibold">{{ fmt(closeForm.buyPrice) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">CMP</p>
            <p class="font-semibold" :class="closeForm.cmp >= closeForm.buyPrice ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'">{{ fmt(closeForm.cmp) }}</p>
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <label for="close-date" class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sell Date</label>
          <InputText inputId="close-date" v-model="closeForm.sellDate" type="date" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label for="close-price" class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sell Price</label>
          <InputNumber inputId="close-price" v-model="closeForm.sellPrice" :minFractionDigits="2" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label for="close-qty" class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Qty to Sell <span class="normal-case font-normal">(max {{ closeForm.maxQty }})</span></label>
          <InputNumber inputId="close-qty" v-model="closeForm.qty" :min="1" :max="closeForm.maxQty" class="w-full" />
        </div>
        <div v-if="closeForm.sellPrice && closeForm.qty" class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm">
          <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Projected P&amp;L</p>
          <p :class="closePnl >= 0 ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-500 dark:text-red-400 font-semibold'">
            {{ fmt(closePnl) }} ({{ fmtPct(closePnlPct) }})
          </p>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="closeDialog = false" />
        <Button label="Confirm Close" severity="warn" :disabled="!closeForm.sellPrice || !closeForm.qty || !closeForm.sellDate" @click="confirmClose" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { useDataStore } from '~/stores/data'
import { calcDays, calcBuyValue, calcCurrentValue, calcPctGain, calcAnnualGainPct, fmt, fmtPct } from '~/composables/useCalculations'
import { useTableEditing } from '~/composables/useTableEditing'
import { useTableDelete } from '~/composables/useTableDelete'
import { COLUMNS, FIELD_CONFIGS, BLANK_ROWS } from '~/utils/tableConfigs'

const props = defineProps({
  tableKey: { type: String, required: true },
  title:    { type: String, default: '' },
})

const store = useDataStore()
const { editingRows, refreshKey, isEditing, startEdit, cancelEdit } = useTableEditing()
const { deleteDialog, startDelete, confirmDelete } = useTableDelete(store, props.tableKey)
const closeDialog  = ref(false)
const closeForm    = ref({ stock: '', buyPrice: 0, cmp: 0, maxQty: 0, sellDate: '', sellPrice: 0, qty: 0, sourceId: null })


const columns  = computed(() => COLUMNS[props.tableKey] || [])
const fields   = computed(() => FIELD_CONFIGS[props.tableKey] || [])
const fieldMap = computed(() => Object.fromEntries(fields.value.map(f => [f.key, f])))

function enrichRow(row) {
  const key = props.tableKey
  if (key === 'etfs' || key === 'commodityEtfs') {
    const days = calcDays(row.buyDate)
    const buyValue = calcBuyValue(row.buyPrice, row.qty)
    const currentValue = calcCurrentValue(row.cmp, row.qty)
    return { ...row, days, buyValue, currentValue, pctGain: calcPctGain(currentValue, buyValue) }
  }
  if (key === 'closedEtfs' || key === 'closedCommodityEtfs') {
    const buyValue = calcBuyValue(row.buyRate, row.qty)
    const sellValue = (row.sellPrice || 0) * (row.qty || 0)
    const gain = sellValue - buyValue
    const pctGain = buyValue > 0 ? (gain / buyValue) * 100 : 0
    const buyDate  = row.buyDate  ? new Date(row.buyDate)  : null
    const sellDate = row.sellDate ? new Date(row.sellDate) : null
    const days = buyDate && sellDate ? Math.max(1, Math.floor((sellDate - buyDate) / 86400000)) : 0
    return { ...row, buyValue, sellValue, gain, pctGain, days, annualGainPct: calcAnnualGainPct(pctGain, days) }
  }
  return row
}

const enrichedRows = computed(() => {
  void refreshKey.value
  return store.tables[props.tableKey].map(enrichRow)
})

function saveEdit(data) {
  const row = { id: data.id }
  for (const f of fields.value) {
    row[f.key] = f.type === 'number' ? (Number(data[f.key]) || 0) : data[f.key]
  }
  store.updateRow(props.tableKey, row.id, row)
  editingRows.value = editingRows.value.filter(r => r.id !== data.id)
}

// ── Add row ────────────────────────────────────────────────────────────────
function addRow() {
  const blank = { id: uuidv4(), ...(BLANK_ROWS[props.tableKey] || {}) }
  store.addRow(props.tableKey, blank)
  editingRows.value = [blank]
}

// ── Close ETF position ─────────────────────────────────────────────────────
function startClose(data) {
  const today = new Date().toISOString().slice(0, 10)
  closeForm.value = {
    stock:     data.stock,
    buyPrice:  data.buyPrice,
    cmp:       data.cmp || 0,
    maxQty:    data.qty,
    sellDate:  today,
    sellPrice: data.cmp || 0,
    qty:       data.qty,
    sourceId:  data.id,
    type:      data.type,
    buyDate:   data.buyDate,
  }
  closeDialog.value = true
}

const closePnl = computed(() => {
  const { sellPrice, qty, buyPrice } = closeForm.value
  return (sellPrice - buyPrice) * qty
})

const closePnlPct = computed(() => {
  const { sellPrice, buyPrice } = closeForm.value
  return buyPrice > 0 ? ((sellPrice - buyPrice) / buyPrice) * 100 : 0
})

function confirmClose() {
  const { sellDate, sellPrice, qty, maxQty, sourceId, type, buyDate, buyPrice, stock } = closeForm.value
  const raw = store.tables[props.tableKey].find(r => r.id === sourceId)
  if (!raw) return
  const qtySelling = Math.min(qty, maxQty)
  const targetKey = props.tableKey === 'etfs' ? 'closedEtfs' : 'closedCommodityEtfs'

  const closedRow = {
    id:       uuidv4(),
    stock,
    buyDate,
    buyRate:  buyPrice,
    qty:      qtySelling,
    sellDate,
    sellPrice,
  }
  if (props.tableKey === 'etfs') closedRow.type = type

  store.addRow(targetKey, closedRow)

  if (qtySelling >= raw.qty) {
    store.deleteRow(props.tableKey, sourceId)
  } else {
    store.updateRow(props.tableKey, sourceId, { ...raw, qty: raw.qty - qtySelling })
  }

  closeDialog.value = false
}
</script>
