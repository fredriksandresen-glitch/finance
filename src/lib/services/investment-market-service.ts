import { stockSymbols, type StockMarketData, type StockMarketSnapshot } from "@/features/investments/types";

const STOCK_CACHE_KEY = "finance.market.stocks.v2";
const LEGACY_BMNR_CACHE_KEY = "finance.market.bmnr.v1";
const DEFAULT_MARKET_API_BASE_URL = "https://finance-hazel-theta-99.vercel.app";

function marketApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_MARKET_API_BASE_URL ?? DEFAULT_MARKET_API_BASE_URL;
  if (typeof window !== "undefined" && window.location.hostname.endsWith(".vercel.app")) {
    return window.location.origin;
  }
  return configured.replace(/\/$/, "");
}

function readJson<T>(key: string): T | null {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

function readCachedSnapshot(): StockMarketSnapshot | null {
  const cached = readJson<StockMarketSnapshot>(STOCK_CACHE_KEY);
  if (cached?.stocks?.length) return cached;

  const legacy = readJson<StockMarketData & { usdNok?: number }>(LEGACY_BMNR_CACHE_KEY);
  if (!legacy?.priceNok) return null;
  return {
    stocks: [{ ...legacy, symbol: "BMNR", isLive: false }],
    usdNok: legacy.usdNok ?? legacy.priceNok / legacy.priceUsd,
    fetchedAt: legacy.lastUpdatedAt,
  };
}

function staleStock(stock: StockMarketData): StockMarketData {
  return { ...stock, isLive: false, source: `Lagret (${stock.source})` };
}

export function mergeMarketSnapshots(
  fresh: StockMarketSnapshot | null,
  cached: StockMarketSnapshot | null,
): StockMarketSnapshot | null {
  if (!fresh && !cached) return null;
  const freshBySymbol = new Map(fresh?.stocks.map((stock) => [stock.symbol, stock]));
  const cachedBySymbol = new Map(cached?.stocks.map((stock) => [stock.symbol, stock]));

  const stocks = stockSymbols.flatMap((symbol) => {
    const current = freshBySymbol.get(symbol);
    const previous = cachedBySymbol.get(symbol);
    if (current) {
      return [
        { ...current, history: current.history.length > 1 ? current.history : (previous?.history ?? current.history) },
      ];
    }
    return previous ? [staleStock(previous)] : [];
  });

  return {
    stocks,
    usdNok: fresh?.usdNok ?? cached?.usdNok ?? 0,
    fetchedAt: fresh?.fetchedAt ?? cached?.fetchedAt ?? new Date().toISOString(),
  };
}

export class InvestmentMarketService {
  async getStockMarketData(): Promise<StockMarketSnapshot> {
    const cached = readCachedSnapshot();
    try {
      const response = await fetch(`${marketApiBaseUrl()}/api/stocks`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) throw new Error(`Aksje-API svarte med ${response.status}.`);
      const fresh = (await response.json()) as StockMarketSnapshot;
      const merged = mergeMarketSnapshots(fresh, cached);
      if (!merged?.stocks.length) throw new Error("Aksje-API-et returnerte ingen priser.");
      window.localStorage.setItem(STOCK_CACHE_KEY, JSON.stringify(merged));
      return merged;
    } catch (error) {
      const fallback = mergeMarketSnapshots(null, cached);
      if (fallback?.stocks.length) return fallback;
      throw error;
    }
  }
}

export const investmentMarketService = new InvestmentMarketService();
