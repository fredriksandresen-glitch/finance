export type Currency = "NOK" | "USD" | "EUR" | "GBP" | "SEK" | "DKK";

export type AssetCategory =
  | "aksjer"
  | "krypto"
  | "fond"
  | "kontanter"
  | "eiendom"
  | "andre";

export type TransactionType = "buy" | "sell" | "dividend" | "deposit" | "withdrawal";
export type IncomeExpenseType = "income" | "expense";

export type Asset = {
  id: string;
  name: string;
  symbol: string;
  category: AssetCategory;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  currency: Currency;
  lastUpdated: string;
};

export type Liability = {
  id: string;
  name: string;
  amount: number;
  interestRate: number;
  currency: Currency;
  dueDate?: string;
};

export type Transaction = {
  id: string;
  assetId: string;
  type: TransactionType;
  quantity: number;
  price: number;
  currency: Currency;
  date: string;
  description?: string;
};

export type NetWorthSnapshot = {
  id: string;
  date: string;
  assets: number;
  liabilities: number;
  netWorth: number;
};

export type IncomeExpenseEntry = {
  id: string;
  amount: number;
  date: string;
  category: string;
  description: string;
  type: IncomeExpenseType;
  cadence: "fixed" | "variable";
  recurrence: "recurring" | "one-off";
};

export type UserSettings = {
  defaultCurrency: Currency;
  theme: "system" | "light" | "dark";
  icpCanisterId: string;
  internetIdentityEnabled: boolean;
};

export type Portfolio = {
  id: string;
  ownerName: string;
  assets: Asset[];
  liabilities: Liability[];
  transactions: Transaction[];
  netWorthSnapshots: NetWorthSnapshot[];
  incomeExpenseEntries: IncomeExpenseEntry[];
  settings: UserSettings;
};

export type AssetWithMetrics = Asset & {
  value: number;
  costBasis: number;
  gainLoss: number;
  returnPct: number;
};
