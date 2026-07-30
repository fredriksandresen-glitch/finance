import {
  defaultIcpPortfolio,
  type IcpHoldingEvent,
  type IcpMarketPrice,
  type IcpPortfolio,
} from "@/features/icp/types";

const PORTFOLIO_STORAGE_KEY = "finance.icp.portfolio.v1";
const PRICE_STORAGE_KEY = "finance.icp.market-price.v1";
const HOLDING_EVENTS_STORAGE_KEY = "finance.icp.holding-events.v1";

export interface IcpPortfolioRepository {
  getIcpPortfolio(): Promise<IcpPortfolio>;
  updateIcpPortfolio(portfolio: IcpPortfolio): Promise<IcpPortfolio>;
}

export interface IcpMarketPriceRepository {
  getLastMarketPrice(): Promise<IcpMarketPrice | null>;
  saveLastMarketPrice(price: IcpMarketPrice): Promise<IcpMarketPrice>;
}

export interface IcpHoldingEventRepository {
  getIcpHoldingEvents(): Promise<IcpHoldingEvent[]>;
  appendIcpHoldingEvent(event: IcpHoldingEvent): Promise<IcpHoldingEvent>;
}

export class BrowserIcpRepository
  implements IcpPortfolioRepository, IcpMarketPriceRepository, IcpHoldingEventRepository
{
  async getIcpPortfolio() {
    if (typeof window === "undefined") return structuredClone(defaultIcpPortfolio);
    const stored = window.localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (!stored) return structuredClone(defaultIcpPortfolio);

    const parsed = JSON.parse(stored) as IcpPortfolio;
    return {
      ...defaultIcpPortfolio,
      ...parsed,
      preferredCurrency: "NOK" as const,
      customIcpPrice: parsed.preferredCurrency === "USD" ? defaultIcpPortfolio.customIcpPrice : parsed.customIcpPrice,
    };
  }

  async updateIcpPortfolio(portfolio: IcpPortfolio) {
    if (typeof window !== "undefined") window.localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(portfolio));
    return structuredClone(portfolio);
  }

  async getLastMarketPrice() {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem(PRICE_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as IcpMarketPrice) : null;
  }

  async saveLastMarketPrice(price: IcpMarketPrice) {
    if (typeof window !== "undefined") window.localStorage.setItem(PRICE_STORAGE_KEY, JSON.stringify(price));
    return structuredClone(price);
  }

  async getIcpHoldingEvents() {
    if (typeof window === "undefined") return [];
    const stored = window.localStorage.getItem(HOLDING_EVENTS_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as IcpHoldingEvent[]) : [];
  }

  async appendIcpHoldingEvent(event: IcpHoldingEvent) {
    if (typeof window !== "undefined") {
      const events = await this.getIcpHoldingEvents();
      window.localStorage.setItem(HOLDING_EVENTS_STORAGE_KEY, JSON.stringify([...events, event]));
    }
    return structuredClone(event);
  }
}

export class IcpCanisterPortfolioRepository
  implements IcpPortfolioRepository, IcpMarketPriceRepository, IcpHoldingEventRepository
{
  async getIcpPortfolio(): Promise<IcpPortfolio> {
    // TODO: Replace with a typed actor call once Internet Identity and the Candid bindings are enabled.
    throw new Error("ICP-canisterrepository er ikke aktivert ennå.");
  }

  async updateIcpPortfolio(_portfolio: IcpPortfolio): Promise<IcpPortfolio> {
    void _portfolio;
    // TODO: Persist decimal strings by principal in canister tymvd-6aaaa-aaaam-qjbza-cai.
    throw new Error("ICP-canisterrepository er ikke aktivert ennå.");
  }

  async getLastMarketPrice(): Promise<IcpMarketPrice | null> {
    // TODO: Read the last successful CoinGecko response from stable canister storage.
    throw new Error("ICP-canisterrepository er ikke aktivert ennå.");
  }

  async saveLastMarketPrice(_price: IcpMarketPrice): Promise<IcpMarketPrice> {
    void _price;
    // TODO: Save the server-fetched market price after canister write authorization is defined.
    throw new Error("ICP-canisterrepository er ikke aktivert ennå.");
  }

  async getIcpHoldingEvents(): Promise<IcpHoldingEvent[]> {
    // TODO: Read principal-scoped purchase and sale events from stable canister storage.
    throw new Error("ICP-canisterrepository er ikke aktivert ennå.");
  }

  async appendIcpHoldingEvent(_event: IcpHoldingEvent): Promise<IcpHoldingEvent> {
    void _event;
    // TODO: Append an immutable principal-scoped holding event in the canister.
    throw new Error("ICP-canisterrepository er ikke aktivert ennå.");
  }
}

export const browserIcpRepository = new BrowserIcpRepository();
