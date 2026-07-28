import { normalizeNorwegianDecimal } from "@/features/icp/calculations";
import type { IcpMarketPrice, IcpPortfolio } from "@/features/icp/types";
import {
  browserIcpRepository,
  type IcpMarketPriceRepository,
  type IcpPortfolioRepository,
} from "@/lib/repositories/icp-portfolio-repository";

export class IcpPortfolioService {
  constructor(
    private readonly portfolioRepository: IcpPortfolioRepository,
    private readonly priceRepository: IcpMarketPriceRepository,
  ) {}

  getPortfolio() {
    return this.portfolioRepository.getIcpPortfolio();
  }

  updatePortfolio(portfolio: IcpPortfolio) {
    const normalized: IcpPortfolio = {
      ...portfolio,
      availableIcp: normalizeNorwegianDecimal(portfolio.availableIcp),
      lockedIcp: normalizeNorwegianDecimal(portfolio.lockedIcp),
      stakedMaturity: normalizeNorwegianDecimal(portfolio.stakedMaturity),
      annualRewardRatePercent: normalizeNorwegianDecimal(portfolio.annualRewardRatePercent),
      walletAnnualForecastIcp: normalizeNorwegianDecimal(portfolio.walletAnnualForecastIcp),
      customIcpPrice: normalizeNorwegianDecimal(portfolio.customIcpPrice),
      updatedAt: new Date().toISOString(),
    };
    return this.portfolioRepository.updateIcpPortfolio(normalized);
  }

  getLastMarketPrice() {
    return this.priceRepository.getLastMarketPrice();
  }

  saveLastMarketPrice(price: IcpMarketPrice) {
    return this.priceRepository.saveLastMarketPrice(price);
  }
}

export const icpPortfolioService = new IcpPortfolioService(browserIcpRepository, browserIcpRepository);
