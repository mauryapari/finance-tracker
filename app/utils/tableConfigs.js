import {
  formatCurrency, formatPercentage, formatDuration, gainClass,
  calculateDays, calculateBuyValue, calculateCurrentValue, calculatePercentageGain,
  calculateAnnualGainPercentage, calculateDropFromPeak, calculateTargetValue,
  calculateTotalPotentialGain, calculateRemainingGain,
} from "~/composables/useCalculations";

const STOCK_CLASS = () =>
  "font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-wider text-xs uppercase";

// ── Column display configs ─────────────────────────────────────────────────
// Schema: { field, header, minW?, frozen?, alignFrozen?, format?, bodyClass? }
export const COLUMNS = {
  openPositions: [
    { field: "stock", header: "Stock", minW: "min-w-28", frozen: true, alignFrozen: "left", bodyClass: STOCK_CLASS },
    { field: "buyDate", header: "Buy Date", minW: "min-w-32" },
    { field: "buyPrice", header: "Buy Price", minW: "min-w-28", format: formatCurrency },
    { field: "qty", header: "Qty", minW: "min-w-20" },
    { field: "cmp", header: "CMP", minW: "min-w-28", format: formatCurrency },
    { field: "peakPrice", header: "Peak", minW: "min-w-28", format: formatCurrency },
    {
      field: "dropFromPeak", header: "Drop%", minW: "min-w-24", format: formatPercentage,
      bodyClass: (n) => n > 20 ? "text-red-500 dark:text-red-400 font-medium" : "",
    },
    { field: "percentageGain", header: "% Gain", minW: "min-w-24", format: formatPercentage, bodyClass: gainClass },
    { field: "targetPrice", header: "Target", minW: "min-w-28", format: formatCurrency },
    { field: "totalPotentialGain", header: "Total Pot%", minW: "min-w-28", format: formatPercentage },
    { field: "remainingGain", header: "Remaining%", minW: "min-w-28", format: formatPercentage, bodyClass: (n) => n < 0 ? "text-green-600 dark:text-green-400 font-medium" : "" },
    { field: "days", header: "Days", minW: "min-w-20", format: formatDuration },
    { field: "annualGainPercentage", header: "Annual%", minW: "min-w-24", format: formatPercentage, bodyClass: gainClass },
    { field: "strategyName", header: "Strategy", minW: "min-w-36" },
    { field: "description", header: "Description", minW: "min-w-40" },
    { field: "stockExchange", header: "Exchange", minW: "min-w-24" },
  ],
  closedPositions: [
    { field: "stock", header: "Stock", minW: "min-w-28", frozen: true, alignFrozen: "left", bodyClass: STOCK_CLASS },
    { field: "buyDate", header: "Buy Date", minW: "min-w-32" },
    { field: "buyRate", header: "Buy Rate", minW: "min-w-28", format: formatCurrency },
    { field: "qty", header: "Qty", minW: "min-w-20" },
    { field: "sellDate", header: "Sell Date", minW: "min-w-32" },
    { field: "sellPrice", header: "Sell Price", minW: "min-w-28", format: formatCurrency },
    { field: "gain", header: "Gain", minW: "min-w-28", format: formatCurrency, bodyClass: gainClass },
    { field: "sellValue", header: "Sell Value", minW: "min-w-28", format: formatCurrency },
    { field: "days", header: "Days", minW: "min-w-20", format: formatDuration },
    { field: "percentageGain", header: "% Gain", minW: "min-w-24", format: formatPercentage, bodyClass: gainClass },
    { field: "annualGainPercentage", header: "Annual%", minW: "min-w-24", format: formatPercentage, bodyClass: gainClass },
    { field: "description", header: "Description", minW: "min-w-40" },
  ],
  etfs: [
    { field: "type", header: "Type", minW: "min-w-24" },
    { field: "stock", header: "Stock", frozen: true, alignFrozen: "left", minW: "min-w-28", bodyClass: STOCK_CLASS },
    { field: "stockExchange", header: "Exchange", minW: "min-w-24" },
    { field: "buyDate", header: "Buy Date", minW: "min-w-32" },
    { field: "buyPrice", header: "Buy Price", minW: "min-w-28", format: formatCurrency },
    { field: "qty", header: "Qty", minW: "min-w-20" },
    { field: "cmp", header: "CMP", minW: "min-w-28", format: formatCurrency },
    { field: "percentageGain", header: "% Gain", minW: "min-w-24", format: formatPercentage, bodyClass: gainClass },
    { field: "days", header: "Days", minW: "min-w-20", format: formatDuration },
    { field: "target", header: "Target", minW: "min-w-28", format: formatCurrency },
  ],
  closedEtfs: [
    { field: "type", header: "Type", minW: "min-w-24" },
    { field: "stock", header: "Stock", frozen: true, alignFrozen: "left", minW: "min-w-28", bodyClass: STOCK_CLASS },
    { field: "buyDate", header: "Buy Date", minW: "min-w-32" },
    { field: "buyRate", header: "Buy Rate", minW: "min-w-28", format: formatCurrency },
    { field: "qty", header: "Qty", minW: "min-w-20" },
    { field: "sellDate", header: "Sell Date", minW: "min-w-32" },
    { field: "sellPrice", header: "Sell Price", minW: "min-w-28", format: formatCurrency },
    { field: "gain", header: "Gain", minW: "min-w-28", format: formatCurrency, bodyClass: gainClass },
    { field: "sellValue", header: "Sell Value", minW: "min-w-28", format: formatCurrency },
    { field: "days", header: "Days", minW: "min-w-20", format: formatDuration },
    { field: "percentageGain", header: "% Gain", minW: "min-w-24", format: formatPercentage, bodyClass: gainClass },
    { field: "annualGainPercentage", header: "Annual%", minW: "min-w-24", format: formatPercentage, bodyClass: gainClass },
  ],
  commodityEtfs: [
    { field: "type", header: "Type", minW: "min-w-24" },
    { field: "stock", header: "Stock", frozen: true, alignFrozen: "left", minW: "min-w-28", bodyClass: STOCK_CLASS },
    { field: "stockExchange", header: "Exchange", minW: "min-w-24" },
    { field: "buyDate", header: "Buy Date", minW: "min-w-32" },
    { field: "buyPrice", header: "Buy Price", minW: "min-w-28", format: formatCurrency },
    { field: "qty", header: "Qty", minW: "min-w-20" },
    { field: "cmp", header: "CMP", minW: "min-w-28", format: formatCurrency },
    { field: "percentageGain", header: "% Gain", minW: "min-w-24", format: formatPercentage, bodyClass: gainClass },
    { field: "days", header: "Days", minW: "min-w-20", format: formatDuration },
  ],
  closedCommodityEtfs: [
    { field: "stock", header: "Stock", frozen: true, alignFrozen: "left", minW: "min-w-28", bodyClass: STOCK_CLASS },
    { field: "buyDate", header: "Buy Date", minW: "min-w-32" },
    { field: "buyRate", header: "Buy Rate", minW: "min-w-28", format: formatCurrency },
    { field: "qty", header: "Qty", minW: "min-w-20" },
    { field: "sellDate", header: "Sell Date", minW: "min-w-32" },
    { field: "sellPrice", header: "Sell Price", minW: "min-w-28", format: formatCurrency },
    { field: "gain", header: "Gain", minW: "min-w-28", format: formatCurrency, bodyClass: gainClass },
    { field: "days", header: "Days", minW: "min-w-20", format: formatDuration },
    { field: "sellValue", header: "Sell Value", minW: "min-w-28", format: formatCurrency },
    { field: "percentageGain", header: "% Gain", minW: "min-w-24", format: formatPercentage, bodyClass: gainClass },
    { field: "annualGainPercentage", header: "Annual%", minW: "min-w-24", format: formatPercentage, bodyClass: gainClass },
  ],
  cagrEntries: [
    { field: "text", header: "Description", frozen: true, alignFrozen: "left", minW: "min-w-40" },
    { field: "date", header: "Date", minW: "min-w-32" },
    { field: "amount", header: "Amount", minW: "min-w-32", format: formatCurrency },
    { field: "investmentOrOut", header: "Type", minW: "min-w-24" },
  ],
  commodityCagrEntries: [
    { field: "text", header: "Description", frozen: true, alignFrozen: "left", minW: "min-w-40" },
    { field: "date", header: "Date", minW: "min-w-32" },
    { field: "amount", header: "Amount", minW: "min-w-32", format: formatCurrency },
  ],
};

// ── Form field configs (controls which fields appear in the row editor) ──────
// Schema: { key, label, type?: 'text'|'number'|'decimal'|'date'|'select', options?: [] }
export const FIELD_CONFIGS = {
  openPositions: [
    { key: "stock", label: "Stock" },
    { key: "buyDate", label: "Buy Date", type: "date" },
    { key: "buyPrice", label: "Buy Price", type: "decimal" },
    { key: "qty", label: "Qty", type: "number" },
    { key: "strategyName", label: "Strategy" },
    { key: "targetPrice", label: "Target", type: "decimal" },
    { key: "description", label: "Description" },
    { key: "stockExchange", label: "Exchange", type: "select", options: ["NSE", "BSE"] },
  ],
  closedPositions: [
    { key: "stock", label: "Stock" },
    { key: "buyDate", label: "Buy Date", type: "date" },
    { key: "buyRate", label: "Buy Rate", type: "decimal" },
    { key: "qty", label: "Qty", type: "number" },
    { key: "sellDate", label: "Sell Date", type: "date" },
    { key: "sellPrice", label: "Sell Price", type: "decimal" },
    { key: "sellValue", label: "Sell Value", type: "decimal" },
    { key: "description", label: "Description" },
  ],
  etfs: [
    { key: "type", label: "Type" },
    { key: "stock", label: "Stock Symbol" },
    { key: "buyDate", label: "Buy Date", type: "date" },
    { key: "buyPrice", label: "Buy Price", type: "decimal" },
    { key: "qty", label: "Qty", type: "number" },
    { key: "target", label: "Target", type: "decimal" },
    { key: "stockExchange", label: "Exchange", type: "select", options: ["NSE", "BSE"] },
  ],
  closedEtfs: [
    { key: "type", label: "Type" },
    { key: "stock", label: "Stock Symbol" },
    { key: "buyDate", label: "Buy Date", type: "date" },
    { key: "buyRate", label: "Buy Rate", type: "decimal" },
    { key: "qty", label: "Qty", type: "number" },
    { key: "sellDate", label: "Sell Date", type: "date" },
    { key: "sellPrice", label: "Sell Price", type: "decimal" },
    { key: "sellValue", label: "Sell Value", type: "decimal" },
  ],
  commodityEtfs: [
    { key: "type", label: "Type" },
    { key: "stock", label: "Stock Symbol" },
    { key: "stockExchange", label: "Exchange", type: "select", options: ["NSE", "BSE"] },
    { key: "buyDate", label: "Buy Date", type: "date" },
    { key: "buyPrice", label: "Buy Price", type: "decimal" },
    { key: "qty", label: "Qty", type: "number" },
  ],
  closedCommodityEtfs: [
    { key: "stock", label: "Stock Symbol" },
    { key: "buyDate", label: "Buy Date", type: "date" },
    { key: "buyRate", label: "Buy Rate", type: "decimal" },
    { key: "qty", label: "Qty", type: "number" },
    { key: "sellDate", label: "Sell Date", type: "date" },
    { key: "sellPrice", label: "Sell Price", type: "decimal" },
    { key: "sellValue", label: "Sell Value", type: "decimal" },
  ],
  cagrEntries: [
    { key: "text", label: "Description" },
    { key: "date", label: "Date", type: "date" },
    { key: "amount", label: "Amount", type: "decimal" },
    { key: "investmentOrOut", label: "Type", type: "select", options: ["Investment", "Out"] },
  ],
  commodityCagrEntries: [
    { key: "text", label: "Description" },
    { key: "date", label: "Date", type: "date" },
    { key: "amount", label: "Amount", type: "decimal" },
  ],
};

// ── Blank row templates ────────────────────────────────────────────────────
export const BLANK_ROWS = {
  openPositions: {
    description: "", stock: "", stockExchange: "NSE", buyDate: "",
    buyPrice: 0, qty: 0, strategyName: "", targetPrice: 0,
  },
  closedPositions: {
    description: "", stock: "", buyDate: "", buyRate: 0, qty: 0, sellDate: "", sellPrice: 0,
  },
  etfs: {
    type: "", stock: "", stockExchange: "NSE", buyDate: "",
    buyPrice: 0, qty: 0, target: 0,
  },
  closedEtfs: {
    type: "", stock: "", buyDate: "", buyRate: 0, qty: 0, sellDate: "", sellPrice: 0,
  },
  commodityEtfs: {
    type: "", stock: "", stockExchange: "NSE", buyDate: "", buyPrice: 0, qty: 0,
  },
  closedCommodityEtfs: {
    stock: "", buyDate: "", buyRate: 0, qty: 0, sellDate: "", sellPrice: 0,
  },
  cagrEntries: { text: "", date: "", amount: 0, investmentOrOut: "Investment" },
  commodityCagrEntries: { text: "", date: "", amount: 0 },
};

// ── Row enrichment functions ───────────────────────────────────────────────
// openPositions receives totalCurrentValue as a second arg for portfolioPercentage
export const ENRICHMENT = {
  openPositions: (row, totalCurrentValue) => {
    const days = calculateDays(row.buyDate)
    const buyValue = calculateBuyValue(row.buyPrice, row.qty)
    const currentValue = calculateCurrentValue(row.cmp, row.qty)
    const percentageGain = calculatePercentageGain(currentValue, buyValue)
    const targetValue = calculateTargetValue(row.targetPrice, row.qty)
    return {
      ...row,
      days,
      buyValue,
      currentValue,
      percentageGain,
      annualGainPercentage: calculateAnnualGainPercentage(percentageGain, days),
      dropFromPeak: calculateDropFromPeak(row.peakPrice, row.cmp),
      targetValue,
      totalPotentialGain: calculateTotalPotentialGain(targetValue, buyValue),
      remainingGain: calculateRemainingGain(targetValue, currentValue),
      portfolioPercentage: totalCurrentValue > 0 ? (currentValue / totalCurrentValue) * 100 : 0,
      _targetHit: row.cmp > 0 && row.targetPrice > 0 && row.cmp >= row.targetPrice,
    }
  },
  closedPositions: (row) => {
    const buyValue = calculateBuyValue(row.buyRate, row.qty)
    const sellValue = (row.sellPrice || 0) * (row.qty || 0)
    const gain = sellValue - buyValue
    const percentageGain = buyValue > 0 ? (gain / buyValue) * 100 : 0
    const buyDate = row.buyDate ? new Date(row.buyDate) : null
    const sellDate = row.sellDate ? new Date(row.sellDate) : null
    const days = buyDate && sellDate ? Math.max(1, Math.floor((sellDate - buyDate) / 86400000)) : 0
    return { ...row, buyValue, sellValue, gain, percentageGain, days, annualGainPercentage: calculateAnnualGainPercentage(percentageGain, days) }
  },
  etfs: (row) => {
    const days = calculateDays(row.buyDate)
    const buyValue = calculateBuyValue(row.buyPrice, row.qty)
    const currentValue = calculateCurrentValue(row.cmp, row.qty)
    return { ...row, days, buyValue, currentValue, percentageGain: calculatePercentageGain(currentValue, buyValue) }
  },
  closedEtfs: (row) => {
    const buyValue = calculateBuyValue(row.buyRate, row.qty)
    const sellValue = (row.sellPrice || 0) * (row.qty || 0)
    const gain = sellValue - buyValue
    const percentageGain = buyValue > 0 ? (gain / buyValue) * 100 : 0
    const buyDate = row.buyDate ? new Date(row.buyDate) : null
    const sellDate = row.sellDate ? new Date(row.sellDate) : null
    const days = buyDate && sellDate ? Math.max(1, Math.floor((sellDate - buyDate) / 86400000)) : 0
    return { ...row, buyValue, sellValue, gain, percentageGain, days, annualGainPercentage: calculateAnnualGainPercentage(percentageGain, days) }
  },
  commodityEtfs: (row) => {
    const days = calculateDays(row.buyDate)
    const buyValue = calculateBuyValue(row.buyPrice, row.qty)
    const currentValue = calculateCurrentValue(row.cmp, row.qty)
    return { ...row, days, buyValue, currentValue, percentageGain: calculatePercentageGain(currentValue, buyValue) }
  },
  closedCommodityEtfs: (row) => {
    const buyValue = calculateBuyValue(row.buyRate, row.qty)
    const sellValue = (row.sellPrice || 0) * (row.qty || 0)
    const gain = sellValue - buyValue
    const percentageGain = buyValue > 0 ? (gain / buyValue) * 100 : 0
    const buyDate = row.buyDate ? new Date(row.buyDate) : null
    const sellDate = row.sellDate ? new Date(row.sellDate) : null
    const days = buyDate && sellDate ? Math.max(1, Math.floor((sellDate - buyDate) / 86400000)) : 0
    return { ...row, buyValue, sellValue, gain, percentageGain, days, annualGainPercentage: calculateAnnualGainPercentage(percentageGain, days) }
  },
};

// ── Close-position config ──────────────────────────────────────────────────
// Maps source tableKey → target tableKey for the "close position" flow
export const CLOSE_TARGET_KEY = {
  openPositions: "closedPositions",
  etfs: "closedEtfs",
  commodityEtfs: "closedCommodityEtfs",
};

// Fields to copy from the source row into the closed row.
// 'buyPrice' is automatically remapped to 'buyRate' in the closed row.
// 'qty', 'sellDate', 'sellPrice' are overridden with form values.
export const CLOSE_FIELD_MAP = {
  openPositions: ["stock", "description", "buyDate", "buyPrice", "qty", "sellDate", "sellPrice"],
  etfs: ["stock", "type", "buyDate", "buyPrice", "qty", "sellDate", "sellPrice"],
  commodityEtfs: ["stock", "buyDate", "buyPrice", "qty", "sellDate", "sellPrice"],
};
