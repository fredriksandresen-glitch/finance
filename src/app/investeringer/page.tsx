"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { calculateHistoricalValueSeries, calculateTotalEstimatedHoldings } from "@/features/icp/calculations";
import { combineAssetHistory } from "@/features/investments/investment-history";
import { InvestmentWorkspace } from "@/features/investments/investment-workspace";
import type { CombinedAssetHistoryPoint, StockSymbol } from "@/features/investments/types";
import { icpMarketService } from "@/lib/services/icp-market-service";
import { icpPortfolioService } from "@/lib/services/icp-portfolio-service";
import { investmentMarketService } from "@/lib/services/investment-market-service";
import { portfolioService } from "@/lib/services/portfolio-service";
import type { AssetWithMetrics } from "@/lib/types";

const stockHoldings: Array<{
  symbol: StockSymbol;
  name: string;
  quantity: number;
  purchasePrice: number;
}> = [
  { symbol: "BMNR", name: "BitMine Immersion Technologies", quantity: 700, purchasePrice: 450 },
  { symbol: "SBET", name: "SharpLink Gaming", quantity: 653, purchasePrice: 207 },
  { symbol: "MSTR", name: "Strategy (MicroStrategy)", quantity: 9, purchasePrice: 3903 },
];

export default function InvestmentsPage() {
  const [assets, setAssets] = useState<AssetWithMetrics[]>([]);
  const [history, setHistory] = useState<CombinedAssetHistoryPoint[]>([]);
  const [status, setStatus] = useState("Henter priser fra CoinGecko, Finnhub og Nasdaq ...");
  const [marketFreshness, setMarketFreshness] = useState<"loading" | "live" | "mixed" | "stale">("loading");
  const [refreshing, setRefreshing] = useState(true);

  const load = useCallback(async () => {
    try {
      const [portfolio, icpPortfolio, holdingEvents] = await Promise.all([
        portfolioService.getPortfolio(),
        icpPortfolioService.getPortfolio(),
        icpPortfolioService.getHoldingEvents(),
      ]);
      const [icpPrice, icpPriceHistory, market] = await Promise.all([
        icpMarketService.getCurrentPrice(),
        icpMarketService.getNokHistory(90),
        investmentMarketService.getStockMarketData(),
      ]);

      const totalIcp = calculateTotalEstimatedHoldings(icpPortfolio).toNumber();
      const stocksBySymbol = new Map(market.stocks.map((stock) => [stock.symbol, stock]));
      const stockAssets = stockHoldings.flatMap((holding) => {
        const stock = stocksBySymbol.get(holding.symbol);
        if (!stock) return [];
        return [
          portfolioService.withMetrics({
            id: `asset-${holding.symbol.toLowerCase()}-${stock.isLive ? "live" : "stale"}`,
            name: holding.name,
            symbol: holding.symbol,
            category: "aksjer",
            quantity: holding.quantity,
            purchasePrice: holding.purchasePrice,
            currentPrice: stock.priceNok,
            currency: "NOK",
            lastUpdated: stock.lastUpdatedAt.slice(0, 10),
          }),
        ];
      });
      const featuredAssets = [
        portfolioService.withMetrics({
          id: "asset-icp-live",
          name: "Internet Computer",
          symbol: "ICP",
          category: "krypto",
          quantity: totalIcp,
          purchasePrice: 50,
          currentPrice: Number(icpPrice.nok),
          currency: "NOK",
          lastUpdated: icpPrice.lastUpdatedAt.slice(0, 10),
        }),
        ...stockAssets,
      ];
      setAssets([...featuredAssets, ...portfolioService.getAssetMetrics(portfolio)]);

      const icpHistory = calculateHistoricalValueSeries(
        icpPortfolio,
        icpPriceHistory,
        holdingEvents,
        icpPrice.nok,
        new Date(),
      );
      setHistory(
        combineAssetHistory(
          icpHistory,
          stockHoldings.flatMap((holding) => {
            const stock = stocksBySymbol.get(holding.symbol);
            return stock ? [{ symbol: holding.symbol, quantity: holding.quantity, history: stock.history }] : [];
          }),
        ),
      );
      const liveCount = market.stocks.filter((stock) => stock.isLive).length;
      setMarketFreshness(liveCount === market.stocks.length ? "live" : liveCount === 0 ? "stale" : "mixed");
      setStatus(
        `Aksjer: ${market.stocks.map((stock) => `${stock.symbol} ${stock.isLive ? stock.source : "lagret"}`).join(" · ")} · USD/NOK ${market.usdNok.toLocaleString("nb-NO", { maximumFractionDigits: 4 })}`,
      );
    } catch {
      setMarketFreshness("stale");
      setStatus("Kunne ikke hente markedsdata, og ingen lagrede priser er tilgjengelige ennå. Prøv igjen.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    setMarketFreshness("loading");
    setStatus("Henter priser fra CoinGecko, Finnhub og Nasdaq ...");
    void load();
  }, [load]);

  return (
    <>
      <PageHeader
        title="Investeringer"
        description="Samlet oversikt over beholdninger, livepriser, kostpris og historisk verdi i norske kroner."
      />
      <InvestmentWorkspace
        initialAssets={assets}
        combinedHistory={history}
        marketStatus={status}
        marketFreshness={marketFreshness}
        refreshing={refreshing}
        onRefresh={refresh}
      />
    </>
  );
}
