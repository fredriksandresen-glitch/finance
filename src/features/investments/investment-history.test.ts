import { describe, expect, it } from "vitest";
import { combineAssetHistory } from "@/features/investments/investment-history";

describe("combineAssetHistory", () => {
  it("carries the last stock close across non-trading days and sums both assets", () => {
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
      [{ date: "2026-07-03", closeUsd: 10, closeNok: 100 }],
      700,
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ bmnrValueNok: 70_000, totalValueNok: 70_200 });
    expect(result[1]).toMatchObject({ bmnrValueNok: 70_000, totalValueNok: 70_210 });
  });
});
