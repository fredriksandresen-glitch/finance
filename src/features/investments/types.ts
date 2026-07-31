export type StockHistoryPoint = {
  date: string;
  closeUsd: number;
  closeNok: number;
};

export const stockSymbols = ["BMNR", "SBET", "MSTR"] as const;
export type StockSymbol = (typeof stockSymbols)[number];

export type StockMarketData = {
  symbol: StockSymbol;
  name: string;
  priceUsd: number;
  priceNok: number;
  changePercent: number;
  lastUpdatedAt: string;
  source: string;
  isLive: boolean;
  history: StockHistoryPoint[];
};

export type StockMarketSnapshot = {
  stocks: StockMarketData[];
  usdNok: number;
  fetchedAt: string;
};

export type StockHoldingHistory = {
  symbol: StockSymbol;
  quantity: number;
  history: StockHistoryPoint[];
};

export type CombinedAssetHistoryPoint = {
  date: string;
  icpValueNok: number;
  bmnrValueNok: number;
  sbetValueNok: number;
  mstrValueNok: number;
  totalValueNok: number;
};
