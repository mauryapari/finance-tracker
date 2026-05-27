<template>
  <Dialog
    :visible="true"
    modal
    :header="isEdit ? `Edit — ${form.stock || 'Stock'}` : 'Add to Watchlist'"
    :style="{ width: '560px', maxWidth: '95vw' }"
    :closable="true"
    @update:visible="$emit('cancel')"
  >
    <form
      class="space-y-4 pt-2"
      data-testid="watchlist-form"
      @submit.prevent="handleSave"
    >
      <!-- Stock + Exchange row -->
      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1">
          <label for="wl-stock" class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Stock symbol <span aria-hidden="true" class="text-red-500">*</span>
          </label>
          <InputText
            id="wl-stock"
            v-model="form.stock"
            placeholder="e.g. RELIANCE"
            required
            aria-required="true"
            :aria-describedby="errors.stock ? 'err-stock' : undefined"
            :invalid="!!errors.stock"
            data-testid="input-stock"
            class="uppercase"
            @input="form.stock = ($event.target as HTMLInputElement).value.toUpperCase()"
          />
          <span v-if="errors.stock" id="err-stock" class="text-xs text-red-500" role="alert">
            {{ errors.stock }}
          </span>
        </div>

        <div class="flex flex-col gap-1">
          <label for="wl-exchange" class="text-sm font-medium text-gray-700 dark:text-gray-300">Exchange</label>
          <Select
            id="wl-exchange"
            v-model="form.stockExchange"
            :options="EXCHANGES"
            data-testid="input-exchange"
          />
        </div>
      </div>

      <!-- Signal + Score row -->
      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1">
          <label for="wl-signal" class="text-sm font-medium text-gray-700 dark:text-gray-300">Signal</label>
          <Select
            id="wl-signal"
            v-model="form.signal"
            :options="SIGNALS"
            data-testid="input-signal"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label for="wl-score" class="text-sm font-medium text-gray-700 dark:text-gray-300">
            AI Score (0–100)
          </label>
          <InputNumber
            id="wl-score"
            v-model="form.score"
            :min="0"
            :max="100"
            :step="1"
            placeholder="75"
            fluid
            data-testid="input-score"
          />
        </div>
      </div>

      <!-- Last updated -->
      <div class="flex flex-col gap-1">
        <label for="wl-date" class="text-sm font-medium text-gray-700 dark:text-gray-300">Last updated</label>
        <InputText
          id="wl-date"
          v-model="form.lastUpdated"
          type="date"
          data-testid="input-date"
        />
      </div>

      <!-- Notes -->
      <div class="flex flex-col gap-1">
        <label for="wl-notes" class="text-sm font-medium text-gray-700 dark:text-gray-300">Notes / summary</label>
        <textarea
          id="wl-notes"
          v-model="form.notes"
          rows="2"
          placeholder="Short thesis or summary..."
          class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
          data-testid="input-notes"
        />
      </div>

      <!-- VitePress URL -->
      <div class="flex flex-col gap-1">
        <label for="wl-url" class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Analysis URL <span class="text-gray-400 font-normal">(optional)</span>
        </label>
        <InputText
          id="wl-url"
          v-model="form.vitepressUrl"
          type="url"
          placeholder="https://your-site.com/stocks/RELIANCE"
          data-testid="input-url"
        />
      </div>

      <!-- Conditions -->
      <div class="space-y-3">
        <ConditionTextarea
          v-model="buyConditionsText"
          label="✅ Buy conditions"
          placeholder="One condition per line&#10;e.g. RSI below 40&#10;Strong earnings growth"
          testid="input-buy"
        />
        <ConditionTextarea
          v-model="sellConditionsText"
          label="🚨 Sell conditions"
          placeholder="One condition per line&#10;e.g. Breaks below 200 DMA&#10;Target price reached"
          testid="input-sell"
        />
        <ConditionTextarea
          v-model="holdConditionsText"
          label="⏸ Hold conditions"
          placeholder="One condition per line&#10;e.g. Waiting for next earnings&#10;Trend intact"
          testid="input-hold"
        />
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancel"
          severity="secondary"
          outlined
          data-testid="cancel-btn"
          @click="$emit('cancel')"
        />
        <Button
          :label="isEdit ? 'Save changes' : 'Add to watchlist'"
          :disabled="!form.stock.trim()"
          data-testid="save-btn"
          @click="handleSave"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { WatchlistEntry, WatchlistSignal } from '~/types'

const props = defineProps<{
  entry?: WatchlistEntry
}>()

const emit = defineEmits<{
  save:   [entry: WatchlistEntry]
  cancel: []
}>()

const EXCHANGES = ['NSE', 'BSE', 'Other'] as const
const SIGNALS: WatchlistSignal[] = ['BUY', 'SELL', 'HOLD', 'WATCH']

const isEdit = computed(() => !!props.entry)

const today = new Date().toISOString().slice(0, 10)

function toText(arr: string[]): string {
  return arr.join('\n')
}
function fromText(text: string): string[] {
  return text.split('\n').map(s => s.trim()).filter(Boolean)
}

// Form state
const form = reactive({
  stock:         props.entry?.stock ?? '',
  stockExchange: props.entry?.stockExchange ?? 'NSE',
  signal:        props.entry?.signal ?? 'WATCH' as WatchlistSignal,
  score:         props.entry?.score ?? 50,
  lastUpdated:   props.entry?.lastUpdated ?? today,
  notes:         props.entry?.notes ?? '',
  vitepressUrl:  props.entry?.vitepressUrl ?? '',
})

const buyConditionsText  = ref(toText(props.entry?.buyConditions  ?? []))
const sellConditionsText = ref(toText(props.entry?.sellConditions ?? []))
const holdConditionsText = ref(toText(props.entry?.holdConditions ?? []))

const errors = reactive({ stock: '' })

function handleSave() {
  errors.stock = ''
  if (!form.stock.trim()) {
    errors.stock = 'Stock symbol is required'
    return
  }

  const saved: WatchlistEntry = {
    id:              props.entry?.id ?? uuidv4(),
    stock:           form.stock.trim().toUpperCase(),
    stockExchange:   form.stockExchange as 'NSE' | 'BSE' | 'Other',
    signal:          form.signal,
    score:           form.score ?? 50,
    lastUpdated:     form.lastUpdated || today,
    notes:           form.notes.trim(),
    vitepressUrl:    form.vitepressUrl.trim() || undefined,
    buyConditions:   fromText(buyConditionsText.value),
    sellConditions:  fromText(sellConditionsText.value),
    holdConditions:  fromText(holdConditionsText.value),
  }

  emit('save', saved)
}
</script>
