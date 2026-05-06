<template>
  <div class="pb-8">
    <h2 class="text-base font-semibold text-gray-700 dark:text-gray-200 mb-2">
      Gap Analysis (Actual − Budget)
    </h2>
    <DataTable
      :value="gapRows"
      show-gridlines
      striped-rows
      scrollable
      size="small"
      class="text-sm"
    >
      <Column field="monthLabel" header="Month" frozen class="min-w-24 font-medium" />
      <Column field="extraEquity" header="Extra Equity" class="min-w-32">
        <template #body="{ data }">
          <Button
            variant="link"
            :label="formatCurrency(data.extraEquity)"
            :class="[
              '!p-0 underline decoration-dotted font-medium',
              data.extraEquity >= 0
                ? '!text-green-600 dark:!text-green-400 decoration-green-400'
                : '!text-red-500 dark:!text-red-400 decoration-red-400'
            ]"
            @click="$emit('open-gap-drilldown', 'gap-extra-equity', data)"
          />
        </template>
      </Column>
      <Column field="extraDebt" header="Extra Debt" class="min-w-28">
        <template #body="{ data }">
          <Button
            variant="link"
            :label="formatCurrency(data.extraDebt)"
            :class="[
              '!p-0 underline decoration-dotted font-medium',
              data.extraDebt >= 0
                ? '!text-green-600 dark:!text-green-400 decoration-green-400'
                : '!text-red-500 dark:!text-red-400 decoration-red-400'
            ]"
            @click="$emit('open-gap-drilldown', 'gap-extra-debt', data)"
          />
        </template>
      </Column>
      <Column field="extraCommodities" header="Extra Comm." class="min-w-32">
        <template #body="{ data }">
          <Button
            variant="link"
            :label="formatCurrency(data.extraCommodities)"
            :class="[
              '!p-0 underline decoration-dotted font-medium',
              data.extraCommodities >= 0
                ? '!text-green-600 dark:!text-green-400 decoration-green-400'
                : '!text-red-500 dark:!text-red-400 decoration-red-400'
            ]"
            @click="$emit('open-gap-drilldown', 'gap-extra-comm', data)"
          />
        </template>
      </Column>
      <ColumnGroup type="footer">
        <Row>
          <Column footer="Total" frozen />
          <Column>
            <template #footer>
              <span
                :class="
                  gapTotals.extraEquity >= 0
                    ? 'text-green-600 dark:text-green-400 font-medium'
                    : 'text-red-500 dark:text-red-400 font-medium'
                "
              >
                {{ formatCurrency(gapTotals.extraEquity) }}
              </span>
            </template>
          </Column>
          <Column>
            <template #footer>
              <span
                :class="
                  gapTotals.extraDebt >= 0
                    ? 'text-green-600 dark:text-green-400 font-medium'
                    : 'text-red-500 dark:text-red-400 font-medium'
                "
              >
                {{ formatCurrency(gapTotals.extraDebt) }}
              </span>
            </template>
          </Column>
          <Column>
            <template #footer>
              <span
                :class="
                  gapTotals.extraCommodities >= 0
                    ? 'text-green-600 dark:text-green-400 font-medium'
                    : 'text-red-500 dark:text-red-400 font-medium'
                "
              >
                {{ formatCurrency(gapTotals.extraCommodities) }}
              </span>
            </template>
          </Column>
        </Row>
      </ColumnGroup>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from '~/composables/useCalculations'

defineProps({
  gapRows: { type: Array, required: true },
  gapTotals: { type: Object, required: true },
})

defineEmits(['open-gap-drilldown'])
</script>
