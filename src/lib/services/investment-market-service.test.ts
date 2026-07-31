import { describe, expect, it } from "vitest";
import type { StockMarketData, StockMarketSnapshot } from "@/features/investments/types";
import { mergeMarketSnapshots } from "@/lib/services/investment-market-service";

function stock(symbol: StockMarketData["symbol"], isLive = true): StockMarketData {
  return {
    symbol,
    name: symbol,
    priceUsd: 10,
    priceNok: 100,
    changePercent: 1,
    lastUpdatedAt: "2026-07-30T20:00:00.000Z",
    source: "Finnhub",
    isLive,
    history: [{ date: "2026-07-30", closeUsd: 10, closeNok: 100 }],
  };
}

function snapshot(stocks: StockMarketData[]): StockMarketSnapshot {
  return { stocks, usdNok: 10, fetchedAt: "2026-07-30T20:00:00.000Z" };
}

describe("mergeMarketSnapshots", () => {
  it("uses cached data and marks it stale when fresh data is unavailable", () => {
    const result = mergeMarketSnapshots(null, snapshot([stock("BMNR")]));

    expect(result?.stocks[0]).toMatchObject({ symbol: "BMNR", isLive: false, source: "Lagret (Finnhub)" });
  });

  it("keeps cached symbols when a provider returns a partial response", () => {
    const result = mergeMarketSnapshots(
      snapshot([stock("BMNR")]),
      snapshot([stock("BMNR"), stock("SBET"), stock("MSTR")]),
    );

    expect(result?.stocks.map(({ symbol, isLive }) => ({ symbol, isLive }))).toEqual([
      { symbol: "BMNR", isLive: true },
      { symbol: "SBET", isLive: false },
      { symbol: "MSTR", isLive: false },
    ]);
  });
});
