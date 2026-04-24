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
        :alignFrozen="col.alignFrozen"
      >
        <template v-if="col.format || col.bodyClass || col.isStock" #body="{ data }">
          <span v-if="col.isStock" class="font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-wider text-xs uppercase">{{ data[col.field] }}</span>
          <span v-else-if="col.bodyClass" :class="col.bodyClass(data[col.field])">{{ col.format ? col.format(data[col.field]) : data[col.field] }}</span>
          <template v-else>{{ col.format(data[col.field]) }}</template>
        </template>
        <template v-if="col.editorType" #editor="{ data, field }">
          <Select v-if="col.editorType === 'select'" v-model="data[field]" :options="col.options" size="small" class="w-full" />
          <InputText v-else-if="col.editorType === 'date'" v-model="data[field]" type="date" size="small" class="w-full" />
          <InputNumber v-else-if="col.editorType === 'decimal'" v-model="data[field]" :minFractionDigits="2" size="small" class="w-full" />
          <InputNumber v-else-if="col.editorType === 'number'" v-model="data[field]" size="small" class="w-full" />
          <InputText v-else v-model="data[field]" size="small" class="w-full" />
        </template>
      </Column>

      <!-- ── ACTIONS ─────────────────────────────── -->
      <Column class="w-32 text-center" frozen alignFrozen="right">
        <template #body="{ data }">
          <div class="flex gap-0.5 justify-center">
            <template v-if="isEditing(data.id)">
              <Button icon="pi pi-check" text rounded size="small" severity="success" @click="saveEdit(data)" />
              <Button icon="pi pi-times" text rounded size="small" severity="secondary" @click="cancelEdit()" />
            </template>
            <template v-else>
              <Button icon="pi pi-pencil" text rounded size="small" @click="startEdit(data)" />
              <Button v-if="type === 'open'" icon="pi pi-sign-out" text rounded size="small" severity="warn" v-tooltip.top="'Close position'" @click="startSell(data)" />
              <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="startDelete(data.id)" />
            </template>
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Delete confirmation dialog -->
    <Dialog v-model:visible="deleteDialog" modal header="Confirm Delete" :style="{ width: '22rem' }">
      <p class="text-gray-600 dark:text-gray-300 mb-4">Delete this row? This cannot be undone.</p>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" text @click="deleteDialog = false" />
        <Button label="Delete" severity="danger" @click="confirmDelete" />
      </div>
    </Dialog>

    <!-- Close position dialog -->
    <Dialog v-model:visible="sellDialog" modal header="Close Position" :style="{ width: '26rem' }">
      <div class="space-y-4 pt-1">
        <div class="grid grid-cols-2 gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm">
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Stock</p>
            <p class="font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">{{ sellForm.stock }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Available Qty</p>
            <p class="font-semibold">{{ sellForm.maxQty }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Buy Price</p>
            <p class="font-semibold">{{ fmt(sellForm.buyPrice) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">CMP</p>
            <p class="font-semibold" :class="sellForm.cmp >= sellForm.buyPrice ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'">{{ fmt(sellForm.cmp) }}</p>
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label for="sell-date" class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sell Date</label>
          <InputText inputId="sell-date" v-model="sellForm.sellDate" type="date" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label for="sell-price" class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sell Price</label>
          <InputNumber inputId="sell-price" v-model="sellForm.sellPrice" :minFractionDigits="2" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label for="sell-qty" class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Qty to Sell <span class="normal-case font-normal">(max {{ sellForm.maxQty }})</span></label>
          <InputNumber inputId="sell-qty" v-model="sellForm.qty" :min="1" :max="sellForm.maxQty" class="w-full" />
        </div>

        <div v-if="sellForm.sellPrice && sellForm.qty" class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm">
          <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Projected P&amp;L</p>
          <p :class="sellPnl >= 0 ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-500 dark:text-red-400 font-semibold'">
            {{ fmt(sellPnl) }} ({{ fmtPct(sellPnlPct) }})
          </p>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" text @click="sellDialog = false" />
        <Button label="Confirm Close" severity="warn" :disabled="!sellForm.sellPrice || !sellForm.qty || !sellForm.sellDate" @click="confirmSell" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { useDataStore } from '~/stores/data'
import {
  calcDays, calcBuyValue, calcCurrentValue, calcPctGain,
  calcAnnualGainPct, calcDropFromPeak, calcTargetValue,
  calcTotalPotentialGain, calcRemainingGain, fmt, fmtPct
} from '~/composables/useCalculations'
import { useTableEditing } from '~/composables/useTableEditing'
import { useTableDelete } from '~/composables/useTableDelete'
import { COLUMNS } from '~/utils/tableConfigs'

const props = defineProps({
  tableKey: { type: String, required: true },
  title:    { type: String, default: '' },
  type:     { type: String, default: 'open' },
})

const store = useDataStore()
const { editingRows, refreshKey, isEditing, startEdit, cancelEdit } = useTableEditing()
const { deleteDialog, startDelete, confirmDelete } = useTableDelete(store, props.tableKey)
const sellDialog = ref(false)
const sellForm   = ref({ stock: '', buyPrice: 0, cmp: 0, maxQty: 0, sellDate: '', sellPrice: 0, qty: 0, sourceId: null })

function rowClass(row) {
  return row._targetHit ? 'bg-green-50' : ''
}

const columns  = computed(() => COLUMNS[props.tableKey] || [])
// const columns = computed(() => props.type === 'open' ? OPEN_COLUMNS : CLOSED_COLUMNS)

// ── Data enrichment ────────────────────────────────────────────────────────
const totalCurrentValue = computed(() =>
  store.tables[props.tableKey].reduce((s, p) => s + (p.cmp || 0) * (p.qty || 0), 0)
)

function enrichRow(row) {
  if (props.type === 'open') {
    const days = calcDays(row.buyDate)
    const buyValue = calcBuyValue(row.buyPrice, row.qty)
    const currentValue = calcCurrentValue(row.cmp, row.qty)
    const pctGain = calcPctGain(currentValue, buyValue)
    const targetValue = calcTargetValue(row.targetPrice, row.qty)
    return {
      ...row,
      days,
      buyValue,
      currentValue,
      pctGain,
      annualGainPct: calcAnnualGainPct(pctGain, days),
      dropFromPeak: calcDropFromPeak(row.peakPrice, row.cmp),
      targetValue,
      totalPotentialGain: calcTotalPotentialGain(targetValue, buyValue),
      remainingGain: calcRemainingGain(targetValue, currentValue),
      portfolioPct: totalCurrentValue.value > 0 ? (currentValue / totalCurrentValue.value) * 100 : 0,
      _targetHit: row.cmp > 0 && row.targetPrice > 0 && row.cmp >= row.targetPrice,
    }
  } else {
    const buyValue = calcBuyValue(row.buyRate, row.qty)
    const sellValue = (row.sellPrice || 0) * (row.qty || 0)
    const gain = sellValue - buyValue
    const pctGain = buyValue > 0 ? (gain / buyValue) * 100 : 0
    const buyDate = row.buyDate ? new Date(row.buyDate) : null
    const sellDate = row.sellDate ? new Date(row.sellDate) : null
    const days = buyDate && sellDate ? Math.max(1, Math.floor((sellDate - buyDate) / 86400000)) : 0
    return { ...row, buyValue, sellValue, gain, pctGain, days, annualGainPct: calcAnnualGainPct(pctGain, days) }
  }
}

const enrichedRows = computed(() => {
  void refreshKey.value
  return store.tables[props.tableKey].map(enrichRow)
})

// ── Row editing ────────────────────────────────────────────────────────────
const openRawFields   = ['id', 'description', 'stock', 'stockExchange', 'buyDate', 'buyPrice', 'qty', 'cmp', 'peakPrice', 'strategyName', 'targetPrice']
const closedRawFields = ['id', 'description', 'stock', 'buyDate', 'buyRate', 'qty', 'sellDate', 'sellPrice']

function saveEdit(data) {
  const rawFields = props.type === 'open' ? openRawFields : closedRawFields
  const numFields = props.type === 'open'
    ? ['buyPrice', 'qty', 'cmp', 'peakPrice', 'targetPrice']
    : ['buyRate', 'qty', 'sellPrice']
  const row = Object.fromEntries(rawFields.map(f => [f, data[f]]))
  for (const f of numFields) {
    if (row[f] != null) row[f] = Number(row[f]) || 0
  }
  store.updateRow(props.tableKey, row.id, row)
  editingRows.value = editingRows.value.filter(r => r.id !== data.id)
}

// ── Add row ────────────────────────────────────────────────────────────────
function addRow() {
  const id = uuidv4()
  const blank = props.type === 'open'
    ? { id, description: '', stock: '', stockExchange: 'NSE', buyDate: '', buyPrice: 0, qty: 0, cmp: 0, peakPrice: 0, strategyName: '', targetPrice: 0 }
    : { id, description: '', stock: '', buyDate: '', buyRate: 0, qty: 0, sellDate: '', sellPrice: 0 }
  store.addRow(props.tableKey, blank)
  editingRows.value = [blank]
}

// ── Close position (sell) ──────────────────────────────────────────────────
function startSell(data) {
  const today = new Date().toISOString().slice(0, 10)
  sellForm.value = {
    stock:     data.stock,
    buyPrice:  data.buyPrice,
    cmp:       data.cmp || 0,
    maxQty:    data.qty,
    sellDate:  today,
    sellPrice: data.cmp || 0,
    qty:       data.qty,
    sourceId:  data.id,
  }
  sellDialog.value = true
}

const sellPnl = computed(() => {
  const { sellPrice, qty, buyPrice } = sellForm.value
  return (sellPrice - buyPrice) * qty
})

const sellPnlPct = computed(() => {
  const { sellPrice, buyPrice } = sellForm.value
  return buyPrice > 0 ? ((sellPrice - buyPrice) / buyPrice) * 100 : 0
})

function confirmSell() {
  const { sellDate, sellPrice, qty, maxQty, sourceId } = sellForm.value
  const raw = store.tables[props.tableKey].find(r => r.id === sourceId)
  if (!raw) return
  const qtySelling = Math.min(qty, maxQty)

  store.addRow('closedPositions', {
    id:          uuidv4(),
    stock:       raw.stock,
    description: raw.description,
    buyDate:     raw.buyDate,
    buyRate:     raw.buyPrice,
    qty:         qtySelling,
    sellDate,
    sellPrice,
  })

  if (qtySelling >= raw.qty) {
    store.deleteRow(props.tableKey, sourceId)
  } else {
    store.updateRow(props.tableKey, sourceId, { ...raw, qty: raw.qty - qtySelling })
  }

  sellDialog.value = false
}
</script>
