// ── Row types (stored fields only) ────────────────────────────────────────

export interface OpenPosition {
  id: string
  stock: string
  qty: number
  buyPrice: number
  buyDate: string
  cmp: number
  peakPrice: number
  targetPrice: number
  stockExchange: 'NSE' | 'BSE'
  strategyName?: string
  description?: string
}

export interface ClosedPosition {
  id: string
  stock: string
  qty: number
  buyRate: number
  buyDate: string
  sellDate: string
  sellPrice: number
  sellValue?: number
  description?: string
}

export interface Etf {
  id: string
  type: string
  stock: string
  stockExchange: 'NSE' | 'BSE'
  buyDate: string
  buyPrice: number
  qty: number
  cmp: number
  target?: number
}

export interface ClosedEtf {
  id: string
  type: string
  stock: string
  buyDate: string
  buyRate: number
  qty: number
  sellDate: string
  sellPrice: number
  sellValue?: number
}

export interface CommodityEtf {
  id: string
  type: string
  stock: string
  stockExchange: 'NSE' | 'BSE'
  buyDate: string
  buyPrice: number
  qty: number
  cmp: number
}

export interface ClosedCommodityEtf {
  id: string
  type?: string
  stock: string
  buyDate: string
  buyRate: number
  qty: number
  sellDate: string
  sellPrice: number
  sellValue?: number
}

export interface CagrEntry {
  id: string
  text: string
  date: string
  amount: number
  investmentOrOut: 'Investment' | 'Out'
}

export interface CommodityCagrEntry {
  id: string
  text: string
  date: string
  amount: number
}

export interface BudgetYear {
  id: string
  year: number
  totalMonthly: number
  mfEquity: number
  ppf: number
  equityPercentage: number
  debtPercentage: number
  commodityPercentage: number
  goldPercentage: number
  silverPercentage: number
}

export interface BudgetMonthly {
  id: string
  year: number
  month: number
  mfEquity?: number | null
  ppf?: number | null
  totalMonthly?: number | null
}

// ── Store shape ────────────────────────────────────────────────────────────

export type StorageMode = 'local' | 'remote' | 'demo'

export interface Tables {
  openPositions: OpenPosition[]
  closedPositions: ClosedPosition[]
  etfs: Etf[]
  closedEtfs: ClosedEtf[]
  commodityEtfs: CommodityEtf[]
  closedCommodityEtfs: ClosedCommodityEtf[]
  cagrEntries: CagrEntry[]
  commodityCagrEntries: CommodityCagrEntry[]
  budgetYears: BudgetYear[]
  budgetMonthly: BudgetMonthly[]
  watchlist: WatchlistEntry[]
}

export interface DataState {
  version: number
  storageMode: StorageMode
  isDemoMode: boolean
  tables: Tables
}

export type TableKey = keyof Tables

// ── Table config types ─────────────────────────────────────────────────────

export type FieldType = 'text' | 'number' | 'decimal' | 'date' | 'select'

export interface ColumnDef {
  field: string
  header: string
  minW?: string
  frozen?: boolean
  alignFrozen?: 'left' | 'right'
  format?: (v: unknown) => string
  bodyClass?: (v: unknown) => string
}

export interface FieldConfig {
  key: string
  label: string
  type?: FieldType
  options?: string[]
  placeholder?: string
}

// ── Enriched / derived row types ───────────────────────────────────────────

export interface EnrichedOpenPosition extends OpenPosition {
  days: number
  buyValue: number
  currentValue: number
  percentageGain: number
  annualGainPercentage: number
  dropFromPeak: number
  targetValue: number
  totalPotentialGain: number
  remainingGain: number
  portfolioPercentage: number
  _targetHit: boolean
}

// ── Shared structural types ────────────────────────────────────────────────

export interface PositionLike {
  stock: string
  cmp: number
  qty: number
  buyPrice: number
}

// ── Portfolio / summary types ──────────────────────────────────────────────

export interface PortfolioSummary {
  netValue: number
  totalInvested: number
  profit: number
  profitPercentage: number
  cagr: number
}

export interface StoreSummary {
  netValue: number
  totalInvested: number
  profit: number
  profitPercentage: number
}

// ── Auth types ─────────────────────────────────────────────────────────────

export interface AuthStorage {
  token: string
  expiresAt: number
}

export interface AuthHeaders {
  Authorization: string
  'X-Expires-At': string
}

// ── Budget calculation types ───────────────────────────────────────────────

export interface BrokerMonthEntry {
  freshStockEquityEtfs: number
  freshCommodities: number
  sellProceeds: number
  brokerBalance: number
}

export interface BrokerHistoryEntry {
  prefix: string
  sellProceeds: number
  totalBuys: number
  recycled: number
  balance: number
}

export interface StockEquityEtfsBreakdown {
  openPositions: number
  closedPositions: number
  etfs: number
}

export interface TrackingRow {
  _storedId: string | null
  month: number
  monthLabel: string
  monthlyBudget: number | null
  mfEquityOverride: number | null
  ppfOverride: number | null
  mfEquity: number
  ppf: number
  stockEquityEtfs: number
  stockEquityEtfsBreakdown: StockEquityEtfsBreakdown
  commoditiesGold: number
  commoditiesSilver: number
  commodities: number
  investedEquityPercentage: number
  debtPercentage: number
  commoditiesPercentage: number
  totalEquity: number
  totalDebt: number
  totalCommodities: number
  total: number
  stockProfitBooked: number
  sellProceeds: number
  brokerBalance: number
  freshStockEquityEtfs: number
  freshCommodities: number
}

export interface GapRow {
  month: number
  monthLabel: string
  budgetEquity: number
  actualEquity: number
  freshEquity: number
  extraEquity: number
  budgetDebt: number
  actualDebt: number
  extraDebt: number
  budgetCommodities: number
  actualCommodities: number
  freshCommodities: number
  extraCommodities: number
}

// ── XIRR ───────────────────────────────────────────────────────────────────

export interface Cashflow {
  amount: number
  date: string
}

// ── Watchlist ──────────────────────────────────────────────────────────────

export type WatchlistSignal = 'BUY' | 'SELL' | 'HOLD' | 'WATCH'

export interface WatchlistEntry {
  id: string
  stock: string
  stockExchange: 'NSE' | 'BSE' | 'Other'
  signal: WatchlistSignal
  score: number                  // 0–100 AI confidence score
  lastUpdated: string            // ISO date YYYY-MM-DD
  buyConditions: string[]        // checklist items for entry
  sellConditions: string[]       // checklist items for exit
  holdConditions: string[]       // checklist items for hold
  notes: string                  // short summary
  vitepressUrl?: string          // optional link to full AI analysis doc
}

// ── Trade history ───────────────────────────────────────────────────────────

export type TradeEventType = 'BUY' | 'SELL'

export interface TradeEvent {
  id: string
  date: string         // ISO YYYY-MM-DD
  type: TradeEventType
  stock: string
  qty: number
  price: number
  value: number        // price × qty
  tableKey: string
  linkTo: string       // route path
}

export interface HeatmapDay {
  date: string         // ISO YYYY-MM-DD
  count: number
  value: number        // total ₹ traded that day
}
