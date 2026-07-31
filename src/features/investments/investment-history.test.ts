import { describe, expect, it } from "vitest";
import { combineAssetHistory } from "@/features/investments/investment-history";

describe("combineAssetHistory", () => {
  it("carries each stock close across non-trading days and sums every asset", () => {
    const result = combineAssetHistory(
      [
        {
          date: "2026-07-03",
          priceNok: "20",
          maturityIcp: "0",
          totalIcp: "10",
          totalValueNok: "200",
          manualChangeIcp: "0",
        },
        {
          date: "2026-07-04",
          priceNok: "21",
          maturityIcp: "0",
          totalIcp: "10",
          totalValueNok: "210",
          manualChangeIcp: "0",
        },
      ],
      [
        { symbol: "BMNR", quantity: 700, history: [{ date: "2026-07-03", closeUsd: 10, closeNok: 100 }] },
        { symbol: "SBET", quantity: 653, history: [{ date: "2026-07-03", closeUsd: 5, closeNok: 50 }] },
        { symbol: "MSTR", quantity: 9, history: [{ date: "2026-07-03", closeUsd: 90, closeNok: 900 }] },
      ],
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      bmnrValueNok: 70_000,
      sbetValueNok: 32_650,
      mstrValueNok: 8_100,
      totalValueNok: 110_950,
    });
    expect(result[1]).toMatchObject({ totalValueNok: 110_960 });
  });
});
