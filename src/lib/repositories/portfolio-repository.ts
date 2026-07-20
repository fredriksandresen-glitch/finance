import { mockPortfolio } from "@/lib/mock/portfolio";
import type { Portfolio } from "@/lib/types";

export interface PortfolioRepository {
  getPortfolio(): Promise<Portfolio>;
}

export class MockPortfolioRepository implements PortfolioRepository {
  async getPortfolio(): Promise<Portfolio> {
    return structuredClone(mockPortfolio);
  }
}

export const portfolioRepository = new MockPortfolioRepository();
