"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { calculateHistoricalValueSeries, calculateTotalEstimatedHoldings } from "@/features/icp/calculations";
import { combineAssetHistory } from "@/features/investments/investment-history";
import { InvestmentWorkspace } from "@/features/investments/investment-workspace";
import type { CombinedAssetHistoryPoint } from "@/features/investments/types";
import { icpMarketService } from "@/lib/services/icp-market-service";
import { icpPortfolioService } from "@/lib/services/icp-portfolio-service";
import { investmentMarketService } from "@/lib/services/investment-market-service";
import { portfolioService } from "@/lib/services/portfolio-service";
import type { AssetWithMetrics } from "@/lib/types";

const BMNR_QUANTITY = 700;

export default function InvestmentsPage() {
  const [assets, setAssets] = useState<AssetWithMetrics[]>([]);
  const [history, setHistory] = useState<CombinedAssetHistoryPoint[]>([]);
  const [status, setStatus] = useState("Henter livepriser fra CoinGecko og Nasdaq ...");
  const [refreshing, setRefreshing] = useState(true);

  const load = useCallback(async () => {
    try {
      const [portfolio, icpPortfolio, holdingEvents] = await Promise.all([
        portfolioService.getPortfolio(),
        icpPortfolioService.getPortfolio(),
        icpPortfolioService.getHoldingEvents(),
      ]);
      const [icpPrice, icpPriceHistory, bmnr] = await Promise.all([
        icpMarketService.getCurrentPrice(),
        icpMarketService.getNokHistory(90),
        investmentMarketService.getBmnrMarketData(),
      ]);

      const totalIcp = calculateTotalEstimatedHoldings(icpPortfolio).toNumber();
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
        portfolioService.withMetrics({
          id: "asset-bmnr-live",
          name: "BitMine Immersion Technologies",
          symbol: "BMNR",
          category: "aksjer",
          quantity: BMNR_QUANTITY,
          purchasePrice: 450,
          currentPrice: bmnr.priceNok,
          currency: "NOK",
          lastUpdated: bmnr.lastUpdatedAt.slice(0, 10),
        }),
      ];
      setAssets([...featuredAssets, ...portfolioService.getAssetMetrics(portfolio)]);

      const icpHistory = calculateHistoricalValueSeries(
        icpPortfolio,
        icpPriceHistory,
        holdingEvents,
        icpPrice.nok,
        new Date(),
      );
      setHistory(combineAssetHistory(icpHistory, bmnr.history, BMNR_QUANTITY));
      setStatus(
        `ICP: CoinGecko · BMNR: ${bmnr.source} · USD/NOK ${bmnr.usdNok.toLocaleString("nb-NO", { maximumFractionDigits: 4 })}`,
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Markedsdata er midlertidig utilgjengelig.");
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
    setStatus("Henter livepriser fra CoinGecko og Nasdaq ...");
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
        refreshing={refreshing}
        onRefresh={refresh}
      />
    </>
  );
}
