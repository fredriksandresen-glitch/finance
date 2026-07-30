export type IcpCurrency = "USD" | "NOK";
export type RewardCalculationMode = "walletForecast" | "rewardRate";
export type CompoundingMode = "none" | "monthly" | "daily";

export type IcpPortfolio = {
  availableIcp: string;
  lockedIcp: string;
  stakedMaturity: string;
  annualRewardRatePercent: string;
  walletAnnualForecastIcp: string;
  neuronCount: number;
  dissolveDelayMonths: number;
  eightYearGangBonus: boolean;
  autoStakeMaturity: boolean;
  preferredCurrency: IcpCurrency;
  customIcpPrice: string;
  rewardCalculationMode: RewardCalculationMode;
  compoundingMode: CompoundingMode;
  updatedAt: string;
};

export type IcpMarketPrice = {
  usd: string;
  nok: string;
  usd24hChange: string;
  nok24hChange: string;
  lastUpdatedAt: string;
  fetchedAt: string;
  source: "live" | "server-cache" | "local-fallback";
};

export type IcpPriceHistoryPoint = {
  timestamp: string;
  nok: string;
};

export type IcpHoldingEvent = {
  id: string;
  date: string;
  amountIcp: string;
  type: "purchase" | "sale";
  createdAt: string;
};

export type IcpHistoricalValuePoint = {
  date: string;
  priceNok: string;
  maturityIcp: string;
  totalIcp: string;
  totalValueNok: string;
  manualChangeIcp: string;
};

export type RewardPeriod = "day" | "week" | "month" | "year";

export type RewardProjectionRow = {
  period: RewardPeriod;
  rewardIcp: string;
  liveFiatValue: string;
  customFiatValue: string;
};

export const defaultIcpPortfolio: IcpPortfolio = {
  availableIcp: "6009.93",
  lockedIcp: "9400.01",
  stakedMaturity: "1653.53",
  annualRewardRatePercent: "7.96",
  walletAnnualForecastIcp: "879.40",
  neuronCount: 1,
  dissolveDelayMonths: 24,
  eightYearGangBonus: true,
  autoStakeMaturity: true,
  preferredCurrency: "NOK",
  customIcpPrice: "100",
  rewardCalculationMode: "walletForecast",
  compoundingMode: "none",
  updatedAt: "2026-07-28T00:00:00.000Z",
};
