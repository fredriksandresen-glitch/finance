import type { IcpHistoricalValuePoint } from "@/features/icp/types";
import type { CombinedAssetHistoryPoint, StockHoldingHistory, StockSymbol } from "@/features/investments/types";

type StockState = StockHoldingHistory & { index: number; latestPrice: number };

export function combineAssetHistory(
  icpHistory: IcpHistoricalValuePoint[],
  stockHoldings: StockHoldingHistory[],
): CombinedAssetHistoryPoint[] {
  if (icpHistory.length === 0) return [];

  const states = new Map<StockSymbol, StockState>(
    stockHoldings.map((holding) => {
      const history = [...holding.history].toSorted((a, b) => a.date.localeCompare(b.date));
      return [holding.symbol, { ...holding, history, index: 0, latestPrice: history[0]?.closeNok ?? 0 }];
    }),
  );

  return icpHistory.map((point) => {
    for (const state of states.values()) {
      while (state.history[state.index] && state.history[state.index].date <= point.date) {
        state.latestPrice = state.history[state.index].closeNok;
        state.index += 1;
      }
    }

    const stockValue = (symbol: StockSymbol) => {
      const state = states.get(symbol);
      return state ? state.latestPrice * state.quantity : 0;
    };
    const icpValueNok = Number(point.totalValueNok);
    const bmnrValueNok = stockValue("BMNR");
    const sbetValueNok = stockValue("SBET");
    const mstrValueNok = stockValue("MSTR");
    return {
      date: point.date,
      icpValueNok,
      bmnrValueNok,
      sbetValueNok,
      mstrValueNok,
      totalValueNok: icpValueNok + bmnrValueNok + sbetValueNok + mstrValueNok,
    };
  });
}
