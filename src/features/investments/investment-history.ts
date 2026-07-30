import type { IcpHistoricalValuePoint } from "@/features/icp/types";
import type { CombinedAssetHistoryPoint, StockHistoryPoint } from "@/features/investments/types";

export function combineAssetHistory(
  icpHistory: IcpHistoricalValuePoint[],
  stockHistory: StockHistoryPoint[],
  stockQuantity: number,
): CombinedAssetHistoryPoint[] {
  if (icpHistory.length === 0) return [];

  const sortedStockHistory = [...stockHistory].toSorted((a, b) => a.date.localeCompare(b.date));
  let stockIndex = 0;
  let latestStockPrice = sortedStockHistory[0]?.closeNok ?? 0;

  return icpHistory.map((point) => {
    while (sortedStockHistory[stockIndex] && sortedStockHistory[stockIndex].date <= point.date) {
      latestStockPrice = sortedStockHistory[stockIndex].closeNok;
      stockIndex += 1;
    }
    const icpValueNok = Number(point.totalValueNok);
    const bmnrValueNok = latestStockPrice * stockQuantity;
    return {
      date: point.date,
      icpValueNok,
      bmnrValueNok,
      totalValueNok: icpValueNok + bmnrValueNok,
    };
  });
}
