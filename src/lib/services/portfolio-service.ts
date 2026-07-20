import type {
  Asset,
  AssetCategory,
  AssetWithMetrics,
  IncomeExpenseEntry,
  NetWorthSnapshot,
  Portfolio,
} from "@/lib/types";
import { portfolioRepository, type PortfolioRepository } from "@/lib/repositories/portfolio-repository";

const categoryLabels: Record<AssetCategory, string> = {
  aksjer: "Aksjer",
  krypto: "Kryptovaluta",
  fond: "Fond",
  kontanter: "Kontanter",
  eiendom: "Eiendom",
  andre: "Andre investeringer",
};

export class PortfolioService {
  constructor(private readonly repository: PortfolioRepository) {}

  async getPortfolio() {
    return this.repository.getPortfolio();
  }

  withMetrics(asset: Asset): AssetWithMetrics {
    const value = asset.quantity * asset.currentPrice;
    const costBasis = asset.quantity * asset.purchasePrice;
    const gainLoss = value - costBasis;
    const returnPct = costBasis === 0 ? 0 : (gainLoss / costBasis) * 100;
    return { ...asset, value, costBasis, gainLoss, returnPct };
  }

  getAssetMetrics(portfolio: Portfolio) {
    return portfolio.assets.map((asset) => this.withMetrics(asset));
  }

  getTotals(portfolio: Portfolio) {
    const assets = this.getAssetMetrics(portfolio);
    const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
    const totalLiabilities = portfolio.liabilities.reduce((sum, liability) => sum + liability.amount, 0);
    const netWorth = totalAssets - totalLiabilities;
    const income = portfolio.incomeExpenseEntries
      .filter((entry) => entry.type === "income")
      .reduce((sum, entry) => sum + entry.amount, 0);
    const expenses = portfolio.incomeExpenseEntries
      .filter((entry) => entry.type === "expense")
      .reduce((sum, entry) => sum + entry.amount, 0);
    const last = portfolio.netWorthSnapshots.at(-1)?.netWorth ?? netWorth;
    const previous = portfolio.netWorthSnapshots.at(-2)?.netWorth ?? last;
    const yearStart = portfolio.netWorthSnapshots.find((snapshot) => snapshot.date.startsWith("2026-01"))?.netWorth ?? previous;

    return {
      totalAssets,
      totalLiabilities,
      netWorth,
      monthlyIncome: income,
      monthlyExpenses: expenses,
      monthlyChange: last - previous,
      ytdChange: last - yearStart,
    };
  }

  getAllocation(portfolio: Portfolio) {
    const assets = this.getAssetMetrics(portfolio);
    return Object.entries(
      assets.reduce<Record<string, number>>((acc, asset) => {
        acc[categoryLabels[asset.category]] = (acc[categoryLabels[asset.category]] ?? 0) + asset.value;
        return acc;
      }, {}),
    ).map(([name, value]) => ({ name, value }));
  }

  getLargestHoldings(portfolio: Portfolio, limit = 5) {
    return this.getAssetMetrics(portfolio)
      .toSorted((a, b) => b.value - a.value)
      .slice(0, limit);
  }

  getRecentActivity(portfolio: Portfolio) {
    const assetUpdates = portfolio.assets.map((asset) => ({
      id: `asset-${asset.id}`,
      date: asset.lastUpdated,
      label: `${asset.name} oppdatert`,
      amount: asset.quantity * asset.currentPrice,
    }));
    const entries = portfolio.incomeExpenseEntries.map((entry) => ({
      id: `entry-${entry.id}`,
      date: entry.date,
      label: entry.description,
      amount: entry.type === "income" ? entry.amount : -entry.amount,
    }));
    return [...assetUpdates, ...entries].toSorted((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  }

  getCashflowByCategory(entries: IncomeExpenseEntry[]) {
    return Object.entries(
      entries.reduce<Record<string, { income: number; expense: number }>>((acc, entry) => {
        acc[entry.category] ??= { income: 0, expense: 0 };
        acc[entry.category][entry.type] += entry.amount;
        return acc;
      }, {}),
    ).map(([category, values]) => ({ category, ...values }));
  }

  getNetWorthRange(snapshots: NetWorthSnapshot[], range: "1m" | "6m" | "1y" | "all") {
    const counts = { "1m": 2, "6m": 7, "1y": 12, all: snapshots.length };
    return snapshots.slice(-counts[range]);
  }
}

export const portfolioService = new PortfolioService(portfolioRepository);
