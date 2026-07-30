import { describe, expect, it } from "vitest";
import { defaultIcpPortfolio, type IcpHoldingEvent, type IcpMarketPrice } from "@/features/icp/types";
import { IcpPortfolioService } from "@/lib/services/icp-portfolio-service";

function createRepository() {
  let portfolio = structuredClone(defaultIcpPortfolio);
  let price: IcpMarketPrice | null = null;
  const events: IcpHoldingEvent[] = [];

  return {
    async getIcpPortfolio() {
      return structuredClone(portfolio);
    },
    async updateIcpPortfolio(next: typeof portfolio) {
      portfolio = structuredClone(next);
      return structuredClone(portfolio);
    },
    async getLastMarketPrice() {
      return price;
    },
    async saveLastMarketPrice(next: IcpMarketPrice) {
      price = structuredClone(next);
      return structuredClone(next);
    },
    async getIcpHoldingEvents() {
      return structuredClone(events);
    },
    async appendIcpHoldingEvent(event: IcpHoldingEvent) {
      events.push(structuredClone(event));
      return structuredClone(event);
    },
  };
}

describe("IcpPortfolioService", () => {
  it("persists one maturity rollover per Oslo calendar day", async () => {
    const repository = createRepository();
    const service = new IcpPortfolioService(repository, repository, repository);

    const first = await service.getPortfolio("2026-07-30T10:00:00.000Z");
    const second = await service.getPortfolio("2026-07-30T20:00:00.000Z");

    expect(Number(first.stakedMaturity)).toBeCloseTo(1653.53 + (879.4 * 2) / 365, 8);
    expect(second.stakedMaturity).toBe(first.stakedMaturity);
  });

  it("records a manual balance increase as a purchase on the save date", async () => {
    const repository = createRepository();
    const service = new IcpPortfolioService(repository, repository, repository);
    const previous = await service.getPortfolio("2026-07-28T10:00:00.000Z");

    await service.updatePortfolio({ ...previous, availableIcp: "6109.93" }, previous, "2026-07-30T10:00:00.000Z");
    const events = await service.getHoldingEvents();

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ date: "2026-07-30", amountIcp: "100", type: "purchase" });
  });
});
