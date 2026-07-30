import type { StockMarketData } from "@/features/investments/types";

const BMNR_CACHE_KEY = "finance.market.bmnr.v1";
const DEFAULT_MARKET_API_BASE_URL = "https://finance-hazel-theta-99.vercel.app";

function marketApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_MARKET_API_BASE_URL ?? DEFAULT_MARKET_API_BASE_URL;
  if (typeof window !== "undefined" && window.location.hostname.endsWith(".vercel.app")) {
    return window.location.origin;
  }
  return configured.replace(/\/$/, "");
}

export class InvestmentMarketService {
  async getBmnrMarketData(): Promise<StockMarketData> {
    try {
      const response = await fetch(`${marketApiBaseUrl()}/api/bmnr`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`Aksje-API svarte med ${response.status}.`);
      const data = (await response.json()) as StockMarketData;
      window.localStorage.setItem(BMNR_CACHE_KEY, JSON.stringify(data));
      return data;
    } catch (error) {
      const cached = window.localStorage.getItem(BMNR_CACHE_KEY);
      if (cached) return JSON.parse(cached) as StockMarketData;
      throw error;
    }
  }
}

export const investmentMarketService = new InvestmentMarketService();
