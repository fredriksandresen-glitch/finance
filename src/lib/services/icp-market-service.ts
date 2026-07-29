import type { IcpMarketPrice, IcpPriceHistoryPoint } from "@/features/icp/types";

const HISTORY_STORAGE_KEY = "finance.icp.price-history.nok.v1";
const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";

type SimplePriceResponse = {
  "internet-computer"?: {
    usd?: number;
    nok?: number;
    usd_24h_change?: number;
    nok_24h_change?: number;
    last_updated_at?: number;
  };
};

type MarketChartResponse = {
  prices?: [number, number][];
};

async function fetchWithTimeout(url: string, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
  } finally {
    window.clearTimeout(timeout);
  }
}

function parseSimplePrice(payload: SimplePriceResponse): IcpMarketPrice {
  const value = payload["internet-computer"];
  if (!value?.usd || !value.nok || !value.last_updated_at) {
    throw new Error("CoinGecko-responsen mangler prisdata.");
  }

  return {
    usd: String(value.usd),
    nok: String(value.nok),
    usd24hChange: String(value.usd_24h_change ?? 0),
    nok24hChange: String(value.nok_24h_change ?? 0),
    lastUpdatedAt: new Date(value.last_updated_at * 1000).toISOString(),
    fetchedAt: new Date().toISOString(),
    source: "live",
  };
}

export class IcpMarketService {
  async getCurrentPrice(): Promise<IcpMarketPrice> {
    const directUrl = `${COINGECKO_BASE_URL}/simple/price?ids=internet-computer&vs_currencies=usd,nok&include_24hr_change=true&include_last_updated_at=true`;
    const directResponse = await fetchWithTimeout(directUrl);
    if (!directResponse.ok) throw new Error(`CoinGecko svarte med ${directResponse.status}.`);
    return parseSimplePrice((await directResponse.json()) as SimplePriceResponse);
  }

  async getNokHistory(days = 90): Promise<IcpPriceHistoryPoint[]> {
    try {
      const response = await fetchWithTimeout(
        `${COINGECKO_BASE_URL}/coins/internet-computer/market_chart?vs_currency=nok&days=${days}&interval=daily`,
      );
      if (!response.ok) throw new Error(`CoinGecko svarte med ${response.status}.`);
      const payload = (await response.json()) as MarketChartResponse;
      if (!payload.prices?.length) throw new Error("Prishistorikken er tom.");

      const points = payload.prices.map(([timestamp, nok]) => ({
        timestamp: new Date(timestamp).toISOString(),
        nok: String(nok),
      }));
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(points));
      return points;
    } catch (error) {
      const cached = window.localStorage.getItem(HISTORY_STORAGE_KEY);
      if (cached) return JSON.parse(cached) as IcpPriceHistoryPoint[];
      throw error;
    }
  }
}

export const icpMarketService = new IcpMarketService();
