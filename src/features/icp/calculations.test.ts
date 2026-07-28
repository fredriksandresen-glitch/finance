import { describe, expect, it } from "vitest";
import {
  calculateEffectiveRewardStake,
  calculateRewardForPeriod,
  calculateRewardProjection,
  normalizeNorwegianDecimal,
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

  it("calculates fiat value from the custom price", () => {
    const rows = calculateRewardProjection(defaultIcpPortfolio, "2");
    expect(rows.find((row) => row.period === "year")?.customFiatValue).toBe("8794");
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
});
