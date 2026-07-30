import {
  calculateTotalEstimatedHoldings,
  normalizeNorwegianDecimal,
  rollForwardDailyMaturity,
  toOsloDate,
} from "@/features/icp/calculations";
import type { IcpHoldingEvent, IcpMarketPrice, IcpPortfolio } from "@/features/icp/types";
import {
  browserIcpRepository,
  type IcpHoldingEventRepository,
  type IcpMarketPriceRepository,
  type IcpPortfolioRepository,
} from "@/lib/repositories/icp-portfolio-repository";

export class IcpPortfolioService {
  constructor(
    private readonly portfolioRepository: IcpPortfolioRepository,
    private readonly priceRepository: IcpMarketPriceRepository,
    private readonly holdingEventRepository: IcpHoldingEventRepository,
  ) {}

  async getPortfolio(now: string | Date = new Date()) {
    const stored = await this.portfolioRepository.getIcpPortfolio();
    const rolled = rollForwardDailyMaturity(stored, now);
    if (rolled.updatedAt !== stored.updatedAt) {
      await this.portfolioRepository.updateIcpPortfolio(rolled);
    }
    return rolled;
  }

  async updatePortfolio(
    portfolio: IcpPortfolio,
    previousPortfolio: IcpPortfolio = portfolio,
    now: string | Date = new Date(),
  ) {
    const nowDate = typeof now === "string" ? new Date(now) : now;
    const rolledPortfolio = rollForwardDailyMaturity(portfolio, nowDate);
    const rolledPreviousPortfolio = rollForwardDailyMaturity(previousPortfolio, nowDate);
    const normalized: IcpPortfolio = {
      ...rolledPortfolio,
      preferredCurrency: "NOK",
      availableIcp: normalizeNorwegianDecimal(rolledPortfolio.availableIcp),
      lockedIcp: normalizeNorwegianDecimal(rolledPortfolio.lockedIcp),
      stakedMaturity: normalizeNorwegianDecimal(rolledPortfolio.stakedMaturity),
      annualRewardRatePercent: normalizeNorwegianDecimal(rolledPortfolio.annualRewardRatePercent),
      walletAnnualForecastIcp: normalizeNorwegianDecimal(rolledPortfolio.walletAnnualForecastIcp),
      customIcpPrice: normalizeNorwegianDecimal(rolledPortfolio.customIcpPrice),
      updatedAt: nowDate.toISOString(),
    };
    const saved = await this.portfolioRepository.updateIcpPortfolio(normalized);
    const holdingDelta = calculateTotalEstimatedHoldings(normalized).minus(
      calculateTotalEstimatedHoldings(rolledPreviousPortfolio),
    );

    if (!holdingDelta.isZero()) {
      const event: IcpHoldingEvent = {
        id: `${nowDate.getTime()}-${Math.random().toString(36).slice(2, 9)}`,
        date: toOsloDate(nowDate),
        amountIcp: holdingDelta.toString(),
        type: holdingDelta.greaterThan(0) ? "purchase" : "sale",
        createdAt: nowDate.toISOString(),
      };
      await this.holdingEventRepository.appendIcpHoldingEvent(event);
    }

    return saved;
  }

  getHoldingEvents() {
    return this.holdingEventRepository.getIcpHoldingEvents();
  }

  getLastMarketPrice() {
    return this.priceRepository.getLastMarketPrice();
  }

  saveLastMarketPrice(price: IcpMarketPrice) {
    return this.priceRepository.saveLastMarketPrice(price);
  }
}

export const icpPortfolioService = new IcpPortfolioService(
  browserIcpRepository,
  browserIcpRepository,
  browserIcpRepository,
);
