import Decimal from "decimal.js";
import type {
  CompoundingMode,
  IcpHistoricalValuePoint,
  IcpHoldingEvent,
  IcpPortfolio,
  IcpPriceHistoryPoint,
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

export function calculateAccruedRewardForDays(portfolio: IcpPortfolio, days: number) {
  const wholeDays = Math.max(0, Math.floor(days));
  if (wholeDays === 0) return decimal(0);

  const initialStake = calculateEffectiveRewardStake(portfolio.lockedIcp, portfolio.stakedMaturity);
  const annualReward = calculateLinearAnnualReward(portfolio);
  if (portfolio.compoundingMode === "none" || initialStake.isZero()) {
    return annualReward.mul(wholeDays).div(365);
  }

  const impliedAnnualRate = initialStake.isZero() ? decimal(0) : annualReward.div(initialStake);
  let accruedReward = decimal(0);
  let compoundedStake = initialStake;
  let pendingMonthlyReward = decimal(0);

  for (let day = 1; day <= wholeDays; day += 1) {
    const dailyReward = compoundedStake.mul(impliedAnnualRate).div(365);

    accruedReward = accruedReward.plus(dailyReward);

    if (portfolio.compoundingMode === "daily") {
      compoundedStake = compoundedStake.plus(dailyReward);
    } else if (portfolio.compoundingMode === "monthly") {
      pendingMonthlyReward = pendingMonthlyReward.plus(dailyReward);
      if (day % 30 === 0) {
        compoundedStake = compoundedStake.plus(pendingMonthlyReward);
        pendingMonthlyReward = decimal(0);
      }
    }
  }

  return accruedReward;
}

export function toOsloDate(value: string | Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(typeof value === "string" ? new Date(value) : value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function calendarDayNumber(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

export function calendarDaysBetween(from: string, to: string) {
  return Math.max(0, calendarDayNumber(to) - calendarDayNumber(from));
}

function addCalendarDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days));
  return value.toISOString().slice(0, 10);
}

export function rollForwardDailyMaturity(portfolio: IcpPortfolio, now: string | Date) {
  if (!portfolio.autoStakeMaturity) return structuredClone(portfolio);

  const currentDate = toOsloDate(now);
  const elapsedDays = calendarDaysBetween(toOsloDate(portfolio.updatedAt), currentDate);
  if (elapsedDays === 0) return structuredClone(portfolio);

  const accrued = calculateAccruedRewardForDays(portfolio, elapsedDays);
  return {
    ...portfolio,
    stakedMaturity: decimal(portfolio.stakedMaturity).plus(accrued).toString(),
    updatedAt: `${currentDate}T12:00:00.000Z`,
  };
}

export function calculateHistoricalValueSeries(
  portfolio: IcpPortfolio,
  priceHistory: IcpPriceHistoryPoint[],
  holdingEvents: IcpHoldingEvent[],
  livePriceNok: string,
  todayValue: string | Date,
  days = 90,
): IcpHistoricalValuePoint[] {
  if (priceHistory.length === 0 || !livePriceNok) return [];

  const today = toOsloDate(todayValue);
  const pricesByDate = new Map(
    priceHistory
      .slice()
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map((point) => [toOsloDate(point.timestamp), decimal(point.nok)]),
  );
  pricesByDate.set(today, decimal(livePriceNok));

  const sortedPrices = [...pricesByDate.entries()].sort(([a], [b]) => a.localeCompare(b));
  let lastKnownPrice = sortedPrices[0]?.[1] ?? decimal(livePriceNok);
  const currentTotal = calculateTotalEstimatedHoldings(portfolio);
  const currentMaturity = decimal(portfolio.stakedMaturity);
  const result: IcpHistoricalValuePoint[] = [];

  for (let offset = -(days - 1); offset <= 0; offset += 1) {
    const date = addCalendarDays(today, offset);
    const exactPrice = pricesByDate.get(date);
    if (exactPrice) lastKnownPrice = exactPrice;

    const elapsedToToday = calendarDaysBetween(date, today);
    const maturityAccruedAfterDate = calculateAccruedRewardForDays(portfolio, elapsedToToday);
    const changesAfterDate = holdingEvents
      .filter((event) => event.date > date)
      .reduce((sum, event) => sum.plus(decimal(event.amountIcp)), decimal(0));
    const changesOnDate = holdingEvents
      .filter((event) => event.date === date)
      .reduce((sum, event) => sum.plus(decimal(event.amountIcp)), decimal(0));
    const total = Decimal.max(0, currentTotal.minus(maturityAccruedAfterDate).minus(changesAfterDate));
    const maturity = Decimal.max(0, currentMaturity.minus(maturityAccruedAfterDate));

    result.push({
      date,
      priceNok: lastKnownPrice.toString(),
      maturityIcp: maturity.toString(),
      totalIcp: total.toString(),
      totalValueNok: total.mul(lastKnownPrice).toString(),
      manualChangeIcp: changesOnDate.toString(),
    });
  }

  return result;
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
