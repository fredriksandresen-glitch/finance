import { describe, expect, it } from "vitest";
import {
  calculateEffectiveRewardStake,
  calculateHistoricalValueSeries,
  calculateRewardForPeriod,
  calculateRewardProjection,
  normalizeNorwegianDecimal,
  rollForwardDailyMaturity,
} from "@/features/icp/calculations";
import { defaultIcpPortfolio } from "@/features/icp/types";

describe("ICP reward calculations", () => {
  it("uses the wallet annual forecast for linear period rewards", () => {
    expect(calculateRewardForPeriod(defaultIcpPortfolio, "day").toNumber()).toBeCloseTo(879.4 / 365, 8);
    expect(calculateRewardForPeriod(defaultIcpPortfolio, "week").toNumber()).toBeCloseTo((879.4 * 7) / 365, 8);
    expect(calculateRewardForPeriod(defaultIcpPortfolio, "month").toNumber()).toBeCloseTo(879.4 / 12, 8);
    expect(calculateRewardForPeriod(defaultIcpPortfolio, "year").toNumber()).toBeCloseTo(879.4, 8);
  });

  it("includes staked maturity in effective reward stake", () => {
    expect(calculateEffectiveRewardStake("9400.01", "1653.53").toFixed(2)).toBe("11053.54");
    expect(calculateEffectiveRewardStake("9400,01", "1653,53").toFixed(2)).toBe("11053.54");
  });

  it("estimates rewards from the displayed reward rate", () => {
    const portfolio = { ...defaultIcpPortfolio, rewardCalculationMode: "rewardRate" as const };
    expect(calculateRewardForPeriod(portfolio, "year").toNumber()).toBeCloseTo(879.861784, 6);
    expect(calculateRewardForPeriod(portfolio, "year").toNumber()).not.toBe(879.4);
  });

  it("calculates NOK value from the custom price", () => {
    const rows = calculateRewardProjection(defaultIcpPortfolio, "2");
    expect(rows.find((row) => row.period === "year")?.customFiatValue).toBe("87940");
  });

  it("does not change ICP rewards when only price changes", () => {
    const lowPrice = calculateRewardProjection(defaultIcpPortfolio, "2");
    const highPrice = calculateRewardProjection(defaultIcpPortfolio, "10");
    expect(lowPrice.map((row) => row.rewardIcp)).toEqual(highPrice.map((row) => row.rewardIcp));
    expect(lowPrice[3].liveFiatValue).not.toEqual(highPrice[3].liveFiatValue);
  });

  it("normalizes Norwegian decimal input", () => {
    expect(normalizeNorwegianDecimal("1653,53")).toBe("1653.53");
    expect(normalizeNorwegianDecimal("1 653,53")).toBe("1653.53");
  });

  it("rolls maturity forward once for every elapsed calendar day", () => {
    const rolled = rollForwardDailyMaturity(defaultIcpPortfolio, "2026-07-30T10:00:00.000Z");
    const expected = 1653.53 + (879.4 * 2) / 365;

    expect(Number(rolled.stakedMaturity)).toBeCloseTo(expected, 8);
    expect(rolled.updatedAt).toBe("2026-07-30T12:00:00.000Z");
    expect(rollForwardDailyMaturity(rolled, "2026-07-30T20:00:00.000Z")).toEqual(rolled);
  });

  it("calculates 90 daily historical values and applies purchases only from their date", () => {
    const prices = Array.from({ length: 90 }, (_, index) => ({
      timestamp: new Date(Date.UTC(2026, 4, 2 + index)).toISOString(),
      nok: String(10 + index),
    }));
    const portfolio = { ...defaultIcpPortfolio, availableIcp: "6109.93", updatedAt: "2026-07-30T12:00:00.000Z" };
    const series = calculateHistoricalValueSeries(
      portfolio,
      prices,
      [
        {
          id: "purchase-1",
          date: "2026-07-30",
          amountIcp: "100",
          type: "purchase",
          createdAt: "2026-07-30T10:00:00.000Z",
        },
      ],
      "25",
      "2026-07-30T10:00:00.000Z",
    );

    expect(series).toHaveLength(90);
    expect(series[89].date).toBe("2026-07-30");
    expect(series[89].totalIcp).toBe("17163.47");
    expect(series[89].totalValueNok).toBe("429086.75");
    expect(Number(series[88].totalIcp)).toBeCloseTo(17063.47 - 879.4 / 365, 8);
    expect(series[88].manualChangeIcp).toBe("0");
    expect(series[89].manualChangeIcp).toBe("100");
  });
});
