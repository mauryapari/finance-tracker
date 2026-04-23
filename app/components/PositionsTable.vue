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
      <!-- ── OPEN POSITIONS ───────────────────────── -->
      <Column sortable v-if="type==='open'" field="stock" header="Stock" style="min-width:7rem" frozen alignFrozen="left">
        <template #body="{ data }">
          <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-wider text-xs uppercase">{{ data.stock }}</span>
        </template>
        <template #editor="{ data, field }"><InputText v-model="data[field]" size="small" class="w-full" /></template>
      </Column>
      <Column sortable v-if="type==='open'" field="stockExchange" header="Exchange" style="min-width:6rem">
        <template #editor="{ data, field }">
          <Select v-model="data[field]" :options="['NSE','BSE']" size="small" class="w-full" />
        </template>
      </Column>
      <Column sortable v-if="type==='open'" field="buyDate" header="Buy Date" style="min-width:8rem">
        <template #editor="{ data, field }"><InputText v-model="data[field]" type="date" size="small" class="w-full" /></template>
      </Column>
      <Column sortable v-if="type==='open'" field="buyPrice" header="Buy Price" style="min-width:7rem">
        <template #body="{ data }">{{ fmt(data.buyPrice) }}</template>
        <template #editor="{ data, field }"><InputNumber v-model="data[field]" :minFractionDigits="2" size="small" class="w-full" /></template>
      </Column>
      <Column sortable v-if="type==='open'" field="qty" header="Qty" style="min-width:5rem">
        <template #editor="{ data, field }"><InputNumber v-model="data[field]" size="small" class="w-full" /></template>
      </Column>
      <Column sortable v-if="type==='open'" field="buyValue" header="Buy Value" style="min-width:7rem">
        <template #body="{ data }">{{ fmt(data.buyValue) }}</template>
      </Column>
      <Column sortable v-if="type==='open'" field="cmp" header="CMP" style="min-width:7rem">
        <template #body="{ data }">{{ fmt(data.cmp) }}</template>
        <template #editor="{ data, field }"><InputNumber v-model="data[field]" :minFractionDigits="2" size="small" class="w-full" /></template>
      </Column>
      <Column sortable v-if="type==='open'" field="peakPrice" header="Peak" style="min-width:7rem">
        <template #body="{ data }">{{ fmt(data.peakPrice) }}</template>
        <template #editor="{ data, field }"><InputNumber v-model="data[field]" :minFractionDigits="2" size="small" class="w-full" /></template>
      </Column>
      <Column sortable v-if="type==='open'" field="dropFromPeak" header="Drop%" style="min-width:6rem">
        <template #body="{ data }"><span :class="data.dropFromPeak > 20 ? 'text-red-500 dark:text-red-400 font-medium' : ''">{{ fmtPct(data.dropFromPeak) }}</span></template>
      </Column>
      <Column sortable v-if="type==='open'" field="currentValue" header="Curr Value" style="min-width:7rem">
        <template #body="{ data }">{{ fmt(data.currentValue) }}</template>
      </Column>
      <Column sortable v-if="type==='open'" field="pctGain" header="% Gain" style="min-width:6rem">
        <template #body="{ data }"><span :class="gainClass(data.pctGain)">{{ fmtPct(data.pctGain) }}</span></template>
      </Column>
      <Column sortable v-if="type==='open'" field="annualGainPct" header="Annual%" style="min-width:6rem">
        <template #body="{ data }"><span :class="gainClass(data.annualGainPct)">{{ fmtPct(data.annualGainPct) }}</span></template>
      </Column>
      <Column sortable v-if="type==='open'" field="days" header="Days" style="min-width:5rem" />
      <Column sortable v-if="type==='open'" field="strategyName" header="Strategy" style="min-width:9rem">
        <template #editor="{ data, field }"><InputText v-model="data[field]" size="small" class="w-full" /></template>
      </Column>
      <Column sortable v-if="type==='open'" field="targetPrice" header="Target" style="min-width:7rem">
        <template #body="{ data }">{{ fmt(data.targetPrice) }}</template>
        <template #editor="{ data, field }"><InputNumber v-model="data[field]" :minFractionDigits="2" size="small" class="w-full" /></template>
      </Column>
      <Column sortable v-if="type==='open'" field="totalPotentialGain" header="Total Pot%" style="min-width:7rem">
        <template #body="{ data }">{{ fmtPct(data.totalPotentialGain) }}</template>
      </Column>
      <Column sortable v-if="type==='open'" field="remainingGain" header="Remaining%" style="min-width:7rem">
        <template #body="{ data }">{{ fmtPct(data.remainingGain) }}</template>
      </Column>
      <Column sortable v-if="type==='open'" field="targetValue" header="Target Val" style="min-width:7rem">
        <template #body="{ data }">{{ fmt(data.targetValue) }}</template>
      </Column>
      <Column sortable v-if="type==='open'" field="description" header="Description" style="min-width:10rem">
        <template #editor="{ data, field }"><InputText v-model="data[field]" size="small" class="w-full" /></template>
      </Column>

      <!-- ── CLOSED POSITIONS ────────────────────── -->
      <Column sortable v-if="type==='closed'" field="stock" header="Stock" style="min-width:7rem" frozen alignFrozen="left">
        <template #body="{ data }">
          <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-wider text-xs uppercase">{{ data.stock }}</span>
        </template>
        <template #editor="{ data, field }"><InputText v-model="data[field]" size="small" class="w-full" /></template>
      </Column>
      <Column sortable v-if="type==='closed'" field="buyDate" header="Buy Date" style="min-width:8rem">
        <template #editor="{ data, field }"><InputText v-model="data[field]" type="date" size="small" class="w-full" /></template>
      </Column>
      <Column sortable v-if="type==='closed'" field="buyRate" header="Buy Rate" style="min-width:7rem">
        <template #body="{ data }">{{ fmt(data.buyRate) }}</template>
        <template #editor="{ data, field }"><InputNumber v-model="data[field]" :minFractionDigits="2" size="small" class="w-full" /></template>
      </Column>
      <Column sortable v-if="type==='closed'" field="qty" header="Qty" style="min-width:5rem">
        <template #editor="{ data, field }"><InputNumber v-model="data[field]" size="small" class="w-full" /></template>
      </Column>
      <Column sortable v-if="type==='closed'" field="buyValue" header="Buy Value" style="min-width:7rem">
        <template #body="{ data }">{{ fmt(data.buyValue) }}</template>
      </Column>
      <Column sortable v-if="type==='closed'" field="sellDate" header="Sell Date" style="min-width:8rem">
        <template #editor="{ data, field }"><InputText v-model="data[field]" type="date" size="small" class="w-full" /></template>
      </Column>
      <Column sortable v-if="type==='closed'" field="sellPrice" header="Sell Price" style="min-width:7rem">
        <template #body="{ data }">{{ fmt(data.sellPrice) }}</template>
        <template #editor="{ data, field }"><InputNumber v-model="data[field]" :minFractionDigits="2" size="small" class="w-full" /></template>
      </Column>
      <Column sortable v-if="type==='closed'" field="sellValue" header="Sell Value" style="min-width:7rem">
        <template #body="{ data }">{{ fmt(data.sellValue) }}</template>
      </Column>
      <Column sortable v-if="type==='closed'" field="gain" header="Gain" style="min-width:7rem">
        <template #body="{ data }"><span :class="gainClass(data.gain)">{{ fmt(data.gain) }}</span></template>
      </Column>
      <Column sortable v-if="type==='closed'" field="days" header="Days" style="min-width:5rem" />
      <Column sortable v-if="type==='closed'" field="pctGain" header="% Gain" style="min-width:6rem">
        <template #body="{ data }"><span :class="gainClass(data.pctGain)">{{ fmtPct(data.pctGain) }}</span></template>
      </Column>
      <Column sortable v-if="type==='closed'" field="annualGainPct" header="Annual%" style="min-width:6rem">
        <template #body="{ data }"><span :class="gainClass(data.annualGainPct)">{{ fmtPct(data.annualGainPct) }}</span></template>
      </Column>
      <Column sortable v-if="type==='closed'" field="description" header="Description" style="min-width:10rem">
        <template #editor="{ data, field }"><InputText v-model="data[field]" size="small" class="w-full" /></template>
      </Column>

      <!-- ── ACTIONS (combined) ─────────────────── -->
      <Column style="width:8rem;text-align:center" frozen alignFrozen="right">
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
        <!-- Context info -->
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

        <!-- Editable fields -->
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

        <!-- Projected P&L preview -->
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
  calcTotalPotentialGain, calcRemainingGain
} from '~/composables/useCalculations'

const props = defineProps({
  tableKey: { type: String, required: true },
  title:    { type: String, default: '' },
  type:     { type: String, default: 'open' },
})

const store = useDataStore()
const editingRows = ref([])
const refreshKey  = ref(0)
const deleteDialog = ref(false)
const deletingId   = ref(null)
const sellDialog   = ref(false)
const sellForm     = ref({ stock: '', buyPrice: 0, cmp: 0, maxQty: 0, sellDate: '', sellPrice: 0, qty: 0, sourceId: null })

const fmt    = n => n != null ? Number(n).toFixed(2) : ''
const fmtPct = n => n != null ? Number(n).toFixed(2) + '%' : ''
const gainClass = n => n >= 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-500 dark:text-red-400 font-medium'

function rowClass(row) {
  return row._targetHit ? 'bg-green-50' : ''
}

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

const isEditing = id => editingRows.value.some(r => r.id === id)

function startEdit(data) {
  editingRows.value = [...editingRows.value, data]
}

function cancelEdit() {
  editingRows.value = []
  refreshKey.value++
}

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

// ── Delete ─────────────────────────────────────────────────────────────────
function startDelete(id) {
  deletingId.value = id
  deleteDialog.value = true
}

function confirmDelete() {
  store.deleteRow(props.tableKey, deletingId.value)
  deleteDialog.value = false
  deletingId.value = null
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
