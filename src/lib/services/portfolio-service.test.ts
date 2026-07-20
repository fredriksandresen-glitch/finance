import { describe, expect, it } from "vitest";
import { mockPortfolio } from "@/lib/mock/portfolio";
import { PortfolioService } from "@/lib/services/portfolio-service";

const repository = {
  async getPortfolio() {
    return structuredClone(mockPortfolio);
  },
};

describe("PortfolioService", () => {
  const service = new PortfolioService(repository);

  it("beregner verdi, kostpris og avkastning for en beholdning", () => {
    const asset = service.withMetrics({
      id: "test",
      name: "Test",
      symbol: "TST",
      category: "aksjer",
      quantity: 10,
      purchasePrice: 100,
      currentPrice: 125,
      currency: "NOK",
      lastUpdated: "2026-07-20",
    });

    expect(asset.value).toBe(1250);
    expect(asset.costBasis).toBe(1000);
    expect(asset.gainLoss).toBe(250);
    expect(asset.returnPct).toBe(25);
  });

  it("summerer nettoformue fra portefolje og gjeld", () => {
    const totals = service.getTotals(mockPortfolio);

    expect(totals.totalAssets).toBeGreaterThan(0);
    expect(totals.totalLiabilities).toBeGreaterThan(0);
    expect(totals.netWorth).toBe(totals.totalAssets - totals.totalLiabilities);
  });
});
