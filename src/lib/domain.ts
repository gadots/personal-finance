export const assetTypes = [
  "STOCK",
  "ETF",
  "MUTUAL_FUND",
  "BOND",
  "CRYPTO",
  "CASH",
  "PRIVATE_ASSET",
  "OTHER",
] as const;

export const baseCurrencies = ["USD", "EUR", "ARS"] as const;
export const operationTypes = ["BUY", "SELL", "DEPOSIT", "WITHDRAW"] as const;

export type AssetType = (typeof assetTypes)[number];
export type BaseCurrency = (typeof baseCurrencies)[number];
export type OperationType = (typeof operationTypes)[number];

export type Portfolio = {
  id: string;
  name: string;
  institutionLabel: string;
};

export type Operation = {
  id: string;
  portfolioId: string;
  type: OperationType;
  assetType?: AssetType;
  instrumentName?: string;
  symbol?: string;
  quantity?: number;
  unitPrice?: number;
  grossAmount?: number;
  feeAmount: number;
  currencyCode: string;
  executedAt: string;
  notes?: string;
};

export const exchangeRates: Record<BaseCurrency, Record<string, number>> = {
  USD: {
    USD: 1,
    EUR: 1.09,
    ARS: 0.00093,
    USDT: 1,
    BTC: 68350,
  },
  EUR: {
    USD: 0.92,
    EUR: 1,
    ARS: 0.00085,
    USDT: 0.92,
    BTC: 62800,
  },
  ARS: {
    USD: 1078,
    EUR: 1176,
    ARS: 1,
    USDT: 1078,
    BTC: 73600000,
  },
};

export const marketPrices: Record<string, { price: number; currencyCode: string }> =
  {
    AAPL: { price: 214.8, currencyCode: "USD" },
    SPY: { price: 518.2, currencyCode: "USD" },
    BTC: { price: 68350, currencyCode: "USD" },
    MELI: { price: 1642.1, currencyCode: "USD" },
  };

export const samplePortfolios: Portfolio[] = [
  { id: "pf-1", name: "Interactive Brokers", institutionLabel: "Broker" },
  { id: "pf-2", name: "Santander Bank", institutionLabel: "Bank" },
  { id: "pf-3", name: "Ledger Wallet", institutionLabel: "Wallet" },
];

export const sampleOperations: Operation[] = [
  {
    id: "op-1",
    portfolioId: "pf-1",
    type: "DEPOSIT",
    grossAmount: 10000,
    feeAmount: 0,
    currencyCode: "USD",
    executedAt: "2026-02-01",
    notes: "Initial funding",
  },
  {
    id: "op-2",
    portfolioId: "pf-1",
    type: "BUY",
    assetType: "STOCK",
    instrumentName: "Apple Inc.",
    symbol: "AAPL",
    quantity: 12,
    unitPrice: 198.4,
    feeAmount: 1,
    currencyCode: "USD",
    executedAt: "2026-02-04",
  },
  {
    id: "op-3",
    portfolioId: "pf-1",
    type: "BUY",
    assetType: "ETF",
    instrumentName: "SPDR S&P 500 ETF",
    symbol: "SPY",
    quantity: 8,
    unitPrice: 503.12,
    feeAmount: 1,
    currencyCode: "USD",
    executedAt: "2026-02-10",
  },
  {
    id: "op-4",
    portfolioId: "pf-2",
    type: "DEPOSIT",
    grossAmount: 8500000,
    feeAmount: 0,
    currencyCode: "ARS",
    executedAt: "2026-02-12",
    notes: "Bank transfer",
  },
  {
    id: "op-5",
    portfolioId: "pf-2",
    type: "BUY",
    assetType: "PRIVATE_ASSET",
    instrumentName: "VC Club Allocation",
    quantity: 1,
    unitPrice: 3500,
    feeAmount: 0,
    currencyCode: "USD",
    executedAt: "2026-02-18",
    notes: "Manual valuation asset",
  },
  {
    id: "op-6",
    portfolioId: "pf-3",
    type: "BUY",
    assetType: "CRYPTO",
    instrumentName: "Bitcoin",
    symbol: "BTC",
    quantity: 0.18,
    unitPrice: 61200,
    feeAmount: 12,
    currencyCode: "USD",
    executedAt: "2026-03-01",
  },
  {
    id: "op-7",
    portfolioId: "pf-1",
    type: "SELL",
    assetType: "STOCK",
    instrumentName: "Apple Inc.",
    symbol: "AAPL",
    quantity: 2,
    unitPrice: 209.5,
    feeAmount: 1,
    currencyCode: "USD",
    executedAt: "2026-03-15",
  },
];
