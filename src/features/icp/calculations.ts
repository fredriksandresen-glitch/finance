import Decimal from "decimal.js";
import type {
  CompoundingMode,
  IcpPortfolio,
  IcpValueProjectionPoint,
  RewardPeriod,
  RewardProjectionRow,
} from "@/features/icp/types";

const MoneyDecimal = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

const periodFractions: Record<RewardPeriod, Decimal> = {
  day: new MoneyDecimal(1).div(365),
  week: new MoneyDecimal(7).div(365),
  month: new MoneyDecimal(1).div(12),
  year: new MoneyDecimal(1),
};

const periodOrder: RewardPeriod[] = ["day", "week", "month", "year"];

export function normalizeNorwegianDecimal(input: string) {
  const compact = input.trim().replace(/[\s\u00a0']/g, "");
  if (!compact) throw new Error("Verdien kan ikke være tom.");

  const commaIndex = compact.lastIndexOf(",");
  const dotIndex = compact.lastIndexOf(".");
  let normalized = compact;

  if (commaIndex >= 0 && dotIndex >= 0) {
    normalized = commaIndex > dotIndex ? compact.replace(/\./g, "").replace(",", ".") : compact.replace(/,/g, "");
  } else if (commaIndex >= 0) {
    normalized = compact.replace(",", ".");
  }

  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) {
    throw new Error("Ugyldig tallformat.");
  }

  return new MoneyDecimal(normalized).toFixed();
}

export function decimal(value: string | number | Decimal) {
  if (typeof value === "string") {
    try {
      return new MoneyDecimal(normalizeNorwegianDecimal(value));
    } catch {
      return new MoneyDecimal(0);
    }
  }
  return new MoneyDecimal(value);
}

export function calculateEffectiveRewardStake(lockedIcp: string, stakedMaturity: string) {
  return decimal(lockedIcp).plus(decimal(stakedMaturity));
}

export function calculateTotalEstimatedHoldings(
  portfolio: Pick<IcpPortfolio, "availableIcp" | "lockedIcp" | "stakedMaturity">,
) {
  return decimal(portfolio.availableIcp).plus(decimal(portfolio.lockedIcp)).plus(decimal(portfolio.stakedMaturity));
}

export function calculateLinearAnnualReward(portfolio: IcpPortfolio) {
  if (
    portfolio.rewardCalculationMode === "walletForecast" &&
    decimal(portfolio.walletAnnualForecastIcp).greaterThan(0)
  ) {
    return decimal(portfolio.walletAnnualForecastIcp);
  }

  return calculateEffectiveRewardStake(portfolio.lockedIcp, portfolio.stakedMaturity).mul(
    decimal(portfolio.annualRewardRatePercent).div(100),
  );
}

function compoundingSteps(period: RewardPeriod, mode: Exclude<CompoundingMode, "none">) {
  if (mode === "monthly") {
    return { periodsPerYear: new MoneyDecimal(12), steps: { day: 0, week: 0, month: 1, year: 12 }[period] };
  }

  return {
    periodsPerYear: new MoneyDecimal(365),
    steps: { day: 1, week: 7, month: new MoneyDecimal(365).div(12), year: 365 }[period],
  };
}

export function calculateRewardForPeriod(portfolio: IcpPortfolio, period: RewardPeriod) {
  const annualReward = calculateLinearAnnualReward(portfolio);
  if (portfolio.compoundingMode === "none") return annualReward.mul(periodFractions[period]);

  const stake = calculateEffectiveRewardStake(portfolio.lockedIcp, portfolio.stakedMaturity);
  if (stake.isZero()) return annualReward.mul(periodFractions[period]);

  const impliedAnnualRate = annualReward.div(stake);
  const { periodsPerYear, steps } = compoundingSteps(period, portfolio.compoundingMode);
  if (decimal(steps).isZero()) return annualReward.mul(periodFractions[period]);

  return stake.mul(decimal(1).plus(impliedAnnualRate.div(periodsPerYear)).pow(steps)).minus(stake);
}

export function calculateRewardProjection(portfolio: IcpPortfolio, livePrice: string): RewardProjectionRow[] {
  return periodOrder.map((period) => {
    const reward = calculateRewardForPeriod(portfolio, period);
    return {
      period,
      rewardIcp: reward.toString(),
      liveFiatValue: reward.mul(decimal(livePrice || "0")).toString(),
      customFiatValue: reward.mul(decimal(portfolio.customIcpPrice || "0")).toString(),
    };
  });
}

export function calculateDailyValueProjection(
  portfolio: IcpPortfolio,
  livePriceNok: string,
  startDate: string,
  days = 365,
): IcpValueProjectionPoint[] {
  const initialTotal = calculateTotalEstimatedHoldings(portfolio);
  const initialMaturity = decimal(portfolio.stakedMaturity);
  const initialStake = calculateEffectiveRewardStake(portfolio.lockedIcp, portfolio.stakedMaturity);
  const annualReward = calculateLinearAnnualReward(portfolio);
  const impliedAnnualRate = initialStake.isZero() ? decimal(0) : annualReward.div(initialStake);
  const linearDailyReward = annualReward.div(365);
  const price = decimal(livePriceNok);
  const start = new Date(startDate);
  let accruedReward = decimal(0);
  let compoundedStake = initialStake;
  let pendingMonthlyReward = decimal(0);
  const points: IcpValueProjectionPoint[] = [];

  for (let day = 0; day <= days; day += 1) {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + day);
    const maturity = portfolio.autoStakeMaturity ? initialMaturity.plus(accruedReward) : initialMaturity;
    const total = initialTotal.plus(accruedReward);

    points.push({
      date: date.toISOString().slice(0, 10),
      day,
      maturityIcp: maturity.toString(),
      totalIcp: total.toString(),
      totalValueNok: total.mul(price).toString(),
    });

    if (day === days) break;

    let dailyReward = linearDailyReward;
    if (portfolio.compoundingMode !== "none" && !initialStake.isZero()) {
      dailyReward = compoundedStake.mul(impliedAnnualRate).div(365);
    }

    accruedReward = accruedReward.plus(dailyReward);

    if (portfolio.compoundingMode === "daily") {
      compoundedStake = compoundedStake.plus(dailyReward);
    } else if (portfolio.compoundingMode === "monthly") {
      pendingMonthlyReward = pendingMonthlyReward.plus(dailyReward);
      if ((day + 1) % 30 === 0) {
        compoundedStake = compoundedStake.plus(pendingMonthlyReward);
        pendingMonthlyReward = decimal(0);
      }
    }
  }

  return points;
}

export function formatIcp(value: string | Decimal, minimumFractionDigits = 2, maximumFractionDigits = 4) {
  const rounded = decimal(value).toDecimalPlaces(maximumFractionDigits).toNumber();
  return `${new Intl.NumberFormat("nb-NO", { minimumFractionDigits, maximumFractionDigits }).format(rounded)} ICP`;
}

export function formatIcpNumber(value: string | Decimal, minimumFractionDigits = 2, maximumFractionDigits = 2) {
  const rounded = decimal(value).toDecimalPlaces(maximumFractionDigits).toNumber();
  return new Intl.NumberFormat("nb-NO", { minimumFractionDigits, maximumFractionDigits }).format(rounded);
}

export function formatFiat(value: string | Decimal, currency: "USD" | "NOK", maximumFractionDigits = 2) {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits,
  }).format(decimal(value).toDecimalPlaces(maximumFractionDigits).toNumber());
}

export function formatIcpPercent(part: string | Decimal, total: string | Decimal) {
  const denominator = decimal(total);
  if (denominator.isZero()) return "0,0 %";
  return `${new Intl.NumberFormat("nb-NO", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(
    decimal(part).div(denominator).mul(100).toDecimalPlaces(1).toNumber(),
  )} %`;
}
