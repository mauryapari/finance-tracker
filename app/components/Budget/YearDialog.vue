<template>
  <Dialog
    :visible="visible"
    modal
    :header="mode === 'edit' ? 'Edit Budget Config' : 'Add Budget Config'"
    :style="{ width: '28rem' }"
    @update:visible="(v) => { if (!v) $emit('close') }"
  >
    <div class="space-y-4 pt-1">
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Year</label>
        <InputNumber
          v-model="form.year"
          :disabled="mode === 'edit'"
          :use-grouping="false"
          fluid
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Monthly Total (₹)</label>
        <InputNumber
          v-model="form.totalMonthly"
          :min-fraction-digits="2"
          fluid
        />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1 min-w-0">
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">MF Equity Default (₹)</label>
          <InputNumber
            v-model="form.mfEquity"
            :min-fraction-digits="2"
            fluid
          />
        </div>
        <div class="flex flex-col gap-1 min-w-0">
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">PPF Default (₹)</label>
          <InputNumber
            v-model="form.ppf"
            :min-fraction-digits="2"
            fluid
          />
        </div>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div class="flex flex-col gap-1 min-w-0">
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Equity %</label>
          <InputNumber
            v-model="form.equityInput"
            :min-fraction-digits="1"
            :min="0"
            :max="100"
            suffix="%"
            fluid
          />
        </div>
        <div class="flex flex-col gap-1 min-w-0">
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Debt %</label>
          <InputNumber
            v-model="form.debtInput"
            :min-fraction-digits="1"
            :min="0"
            :max="100"
            suffix="%"
            fluid
          />
        </div>
        <div class="flex flex-col gap-1 min-w-0">
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Commodity %</label>
          <InputNumber
            v-model="form.commodityInput"
            :min-fraction-digits="1"
            :min="0"
            :max="100"
            suffix="%"
            fluid
          />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1 min-w-0">
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Gold % (of commodity)</label>
          <InputNumber
            v-model="form.goldInput"
            :min-fraction-digits="1"
            :min="0"
            :max="100"
            suffix="%"
            fluid
          />
        </div>
        <div class="flex flex-col gap-1 min-w-0">
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Silver % (of commodity)</label>
          <InputNumber
            v-model="form.silverInput"
            :min-fraction-digits="1"
            :min="0"
            :max="100"
            suffix="%"
            fluid
          />
        </div>
      </div>
      <p class="text-xs text-gray-400 dark:text-gray-500">
        Equity + Debt + Commodity should sum to 100%. Gold + Silver should sum to 100%.
      </p>
    </div>
    <template #footer>
      <Button label="Cancel" text @click="$emit('close')" />
      <Button label="Save" @click="save" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { useDataStore } from '~/stores/data'
import type { BudgetYear } from '~/types'

const props = withDefaults(defineProps<{
  visible: boolean
  mode?: string | null
  budgetYear?: BudgetYear | null
}>(), {
  mode: null,
  budgetYear: null,
})

const emit = defineEmits(['close', 'saved'])

const store = useDataStore()

const DEFAULTS = {
  year: new Date().getFullYear(),
  totalMonthly: 45000,
  mfEquity: 0,
  ppf: 0,
  equityInput: 78,
  debtInput: 12,
  commodityInput: 10,
  goldInput: 80,
  silverInput: 20,
}

const form = ref({ ...DEFAULTS })

watch(
  [() => props.mode, () => props.budgetYear, () => props.visible],
  ([mode, by, visible]) => {
    if (!visible) return
    if (mode === 'edit' && by) {
      form.value = {
        year: by.year,
        totalMonthly: by.totalMonthly,
        mfEquity: by.mfEquity ?? 0,
        ppf: by.ppf ?? 0,
        equityInput: by.equityPercentage * 100,
        debtInput: by.debtPercentage * 100,
        commodityInput: by.commodityPercentage * 100,
        goldInput: by.goldPercentage * 100,
        silverInput: by.silverPercentage * 100,
      }
    } else {
      form.value = { ...DEFAULTS }
    }
  },
  { immediate: true },
)

function save() {
  const row = {
    year: form.value.year,
    totalMonthly: form.value.totalMonthly,
    mfEquity: form.value.mfEquity ?? 0,
    ppf: form.value.ppf ?? 0,
    equityPercentage: (form.value.equityInput || 0) / 100,
    debtPercentage: (form.value.debtInput || 0) / 100,
    commodityPercentage: (form.value.commodityInput || 0) / 100,
    goldPercentage: (form.value.goldInput || 0) / 100,
    silverPercentage: (form.value.silverInput || 0) / 100,
  }
  if (props.mode === 'edit' && props.budgetYear) {
    store.updateRow('budgetYears', props.budgetYear.id, { ...row, id: props.budgetYear.id })
  } else {
    store.addRow('budgetYears', { ...row, id: uuidv4() })
  }
  emit('saved', row.year)
  emit('close')
}
</script>
