<template>
  <div class="flex flex-col flex-1 min-h-0 px-4 overflow-y-auto">
    <div class="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
      <h3 class="font-semibold text-gray-700 dark:text-gray-200 text-base">{{ title }}</h3>
      <div class="flex items-center gap-2">
        <InputText
          v-if="hasStockField"
          v-model="filters['global'].value"
          placeholder="Filter stock…"
          size="small"
          class="w-36"
        />
        <Button
          v-if="hasStockField"
          v-tooltip.top="groupByStock ? 'Ungroup' : 'Group by stock'"
          :icon="groupByStock ? 'pi pi-list' : 'pi pi-sitemap'" text rounded
          size="small"
          @click="groupByStock = !groupByStock"
        />
        <Button size="small" icon="pi pi-plus" label="Add Row" @click="addRow" />
      </div>
    </div>

    <DataTable
      v-model:editing-rows="editingRows"
      v-model:filters="filters"
      :value="enrichedRows"
      edit-mode="row"
      data-key="id"
      :global-filter-fields="['stock']"
      :row-group-mode="groupByStock ? 'rowspan' : undefined"
      :group-rows-by="groupByStock ? 'stock' : undefined"
      :sort-mode="groupByStock ? 'single' : undefined"
      :sort-field="groupByStock ? 'stock' : undefined"
      :sort-order="groupByStock ? 1 : undefined"
      show-gridlines
      striped-rows
      scrollable
      scroll-height="flex"
      removable-sort
      size="large"
      :row-class="rowClass"
      class="text-sm flex-1"
    >
      <Column
        v-for="col in columns"
        :key="col.field"
        sortable
        :field="col.field"
        :header="col.header"
        :class="col.minW"
        :frozen="col.frozen || false"
        :align-frozen="col.alignFrozen"
      >
        <template #body="{ data }">
          <span v-if="col.bodyClass" :class="col.bodyClass(data[col.field])">
            {{ col.format ? col.format(data[col.field]) : data[col.field] }}
          </span>
          <template v-else>{{ col.format ? col.format(data[col.field]) : data[col.field] }}</template>
        </template>
        <template v-if="fieldMap[col.field]" #editor="{ data, field }">
          <Select
            v-if="fieldMap[col.field].type === 'select'"
            v-model="data[field]"
            :options="fieldMap[col.field].options"
            size="small"
            class="w-full"
          />
          <InputText
            v-else-if="fieldMap[col.field].type === 'date'"
            v-model="data[field]"
            type="date"
            size="small"
            class="w-full"
          />
          <InputNumber
            v-else-if="fieldMap[col.field].type === 'decimal'"
            v-model="data[field]"
            :min-fraction-digits="2"
            size="small"
            class="w-full"
          />
          <InputNumber
            v-else-if="fieldMap[col.field].type === 'number'"
            v-model="data[field]"
            size="small"
            class="w-full"
          />
          <InputText v-else v-model="data[field]" size="small" class="w-full" />
        </template>
      </Column>

      <Column class="w-32 text-center" frozen align-frozen="right">
        <template #body="{ data }">
          <div class="flex gap-0.5 justify-center">
            <template v-if="isEditing(data.id)">
              <Button icon="pi pi-check" text rounded size="small" severity="success" @click="saveEdit(data)" />
              <Button icon="pi pi-times" text rounded size="small" severity="secondary" @click="handleCancel(data)" />
            </template>
            <template v-else>
              <Button icon="pi pi-pencil" text rounded size="small" @click="startEdit(data)" />
              <Button
                v-if="canClose"
                v-tooltip.top="'Close position'"
                icon="pi pi-sign-out"
                text
                rounded
                size="small"
                severity="warn"
                @click="startClose(data)"
              />
              <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="startDelete(data.id)" />
            </template>
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="deleteDialog" modal header="Confirm Delete" :style="{ width: '22rem' }">
      <p class="text-gray-600 dark:text-gray-300 mb-4">Delete this row? This cannot be undone.</p>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" text @click="deleteDialog = false" />
        <Button label="Delete" severity="danger" @click="confirmDelete" />
      </div>
    </Dialog>

    <Dialog v-if="canClose" v-model:visible="closeDialog" modal header="Close Position" :style="{ width: '26rem' }">
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
            <p class="font-semibold">{{ formatCurrency(closeForm.buyPrice) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">CMP</p>
            <p
              class="font-semibold"
              :class="closeForm.cmp >= closeForm.buyPrice ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'"
            >{{ formatCurrency(closeForm.cmp) }}</p>
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <label for="close-date" class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sell Date</label>
          <InputText v-model="closeForm.sellDate" input-id="close-date" type="date" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label for="close-price" class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sell Price</label>
          <InputNumber v-model="closeForm.sellPrice" input-id="close-price" :min-fraction-digits="2" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label for="close-qty" class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Qty to Sell <span class="normal-case font-normal">(max {{ closeForm.maxQty }})</span>
          </label>
          <InputNumber v-model="closeForm.qty" input-id="close-qty" :min="1" :max="closeForm.maxQty" class="w-full" />
        </div>
        <div v-if="closeForm.sellPrice && closeForm.qty" class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm">
          <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Projected P&amp;L</p>
          <p :class="closePnl >= 0 ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-500 dark:text-red-400 font-semibold'">
            {{ formatCurrency(closePnl) }} ({{ formatPercentage(closePnlPercentage) }})
          </p>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="closeDialog = false" />
        <Button
          label="Confirm Close"
          severity="warn"
          :disabled="!closeForm.sellPrice || !closeForm.qty || !closeForm.sellDate"
          @click="confirmClose"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { useDataStore } from '~/stores/data'
import { formatCurrency, formatPercentage } from '~/composables/useCalculations'
import { useTableEditing } from '~/composables/useTableEditing'
import { useTableDelete } from '~/composables/useTableDelete'
import { COLUMNS, FIELD_CONFIGS, BLANK_ROWS, ENRICHMENT, CLOSE_TARGET_KEY, CLOSE_FIELD_MAP } from '~/utils/tableConfigs'

const props = defineProps({
  tableKey: { type: String, required: true },
  title:    { type: String, default: '' },
})

const store = useDataStore()
const { editingRows, refreshKey, isEditing, startEdit, cancelEdit } = useTableEditing()
const { deleteDialog, startDelete, confirmDelete } = useTableDelete(store, props.tableKey)
const closeDialog = ref(false)
const closeForm   = ref({ stock: '', buyPrice: 0, cmp: 0, maxQty: 0, sellDate: '', sellPrice: 0, qty: 0, sourceId: null })

const columns        = computed(() => COLUMNS[props.tableKey] || [])
const hasStockField  = computed(() => columns.value.some(c => c.field === 'stock'))
const filters        = ref({ global: { value: null } })
const groupByStock   = ref(false)
const fields         = computed(() => FIELD_CONFIGS[props.tableKey] || [])
const fieldMap       = computed(() => Object.fromEntries(fields.value.map(f => [f.key, f])))
const closeTargetKey = computed(() => CLOSE_TARGET_KEY[props.tableKey])
const canClose       = computed(() => !!closeTargetKey.value)

const totalCurrentValue = computed(() =>
  (store.tables[props.tableKey] || []).reduce((s, p) => s + (p.cmp || 0) * (p.qty || 0), 0)
)

const enrichedRows = computed(() => {
  void refreshKey.value
  const fn = ENRICHMENT[props.tableKey] || (r => r)
  return (store.tables[props.tableKey] || []).map(r => fn(r, totalCurrentValue.value))
})

function rowClass(row) {
  return row._targetHit ? 'bg-green-50' : ''
}

const newRowId = ref(null)

function saveEdit(data) {
  const row = { id: data.id }
  for (const f of fields.value) {
    row[f.key] = (f.type === 'decimal' || f.type === 'number') ? (Number(data[f.key]) || 0) : data[f.key]
  }
  if (row.stock) row.stock = row.stock.toUpperCase()
  store.updateRow(props.tableKey, row.id, row)
  editingRows.value = editingRows.value.filter(r => r.id !== data.id)
  newRowId.value = null
}

function addRow() {
  const blank = { id: uuidv4(), ...(BLANK_ROWS[props.tableKey] || {}) }
  store.addRow(props.tableKey, blank)
  editingRows.value = [blank]
  newRowId.value = blank.id
}

function handleCancel(data) {
  if (newRowId.value && data.id === newRowId.value) {
    store.deleteRow(props.tableKey, newRowId.value)
  }
  newRowId.value = null
  cancelEdit()
}

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
  }
  closeDialog.value = true
}

const closePnl = computed(() => {
  const { sellPrice, qty, buyPrice } = closeForm.value
  return (sellPrice - buyPrice) * qty
})

const closePnlPercentage = computed(() => {
  const { sellPrice, buyPrice } = closeForm.value
  return buyPrice > 0 ? ((sellPrice - buyPrice) / buyPrice) * 100 : 0
})

function confirmClose() {
  const { sellDate, sellPrice, qty, maxQty, sourceId } = closeForm.value
  const raw = store.tables[props.tableKey].find(r => r.id === sourceId)
  if (!raw) return
  const qtySelling = Math.min(qty, maxQty)

  const closedRow = { id: uuidv4() }
  for (const f of (CLOSE_FIELD_MAP[props.tableKey] || [])) {
    if (f === 'buyPrice')   closedRow.buyRate = raw.buyPrice
    else if (f === 'qty')   closedRow.qty = qtySelling
    else if (f === 'sellDate')  closedRow.sellDate = sellDate
    else if (f === 'sellPrice') closedRow.sellPrice = sellPrice
    else                        closedRow[f] = raw[f]
  }

  store.addRow(closeTargetKey.value, closedRow)

  if (qtySelling >= raw.qty) {
    store.deleteRow(props.tableKey, sourceId)
  } else {
    store.updateRow(props.tableKey, sourceId, { ...raw, qty: raw.qty - qtySelling })
  }

  closeDialog.value = false
}
</script>
