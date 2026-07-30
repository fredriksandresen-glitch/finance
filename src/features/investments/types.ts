export type StockHistoryPoint = {
  date: string;
  closeUsd: number;
  closeNok: number;
};

export type StockMarketData = {
  symbol: string;
  name: string;
  priceUsd: number;
  priceNok: number;
  usdNok: number;
  changePercent: number;
  lastUpdatedAt: string;
  source: string;
  history: StockHistoryPoint[];
};

export type CombinedAssetHistoryPoint = {
  date: string;
  icpValueNok: number;
  bmnrValueNok: number;
  totalValueNok: number;
};
