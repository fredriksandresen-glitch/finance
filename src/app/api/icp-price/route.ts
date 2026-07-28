import { NextResponse } from "next/server";
import type { IcpMarketPrice } from "@/features/icp/types";

export const revalidate = 60;

const CACHE_TTL_MS = 60_000;
const MIN_REFRESH_INTERVAL_MS = 20_000;
let cachedPrice: IcpMarketPrice | null = null;
let lastFetchAttempt = 0;

type CoinGeckoResponse = {
  "internet-computer"?: {
    usd?: number;
    nok?: number;
    usd_24h_change?: number;
    nok_24h_change?: number;
    last_updated_at?: number;
  };
};

function priceResponse(price: IcpMarketPrice, status = 200) {
  return NextResponse.json(price, {
    status,
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}

export async function GET(request: Request) {
  const now = Date.now();
  const forceRefresh = new URL(request.url).searchParams.get("refresh") === "1";
  const cacheIsFresh = cachedPrice && now - Date.parse(cachedPrice.fetchedAt) < CACHE_TTL_MS;

  if (cachedPrice && cacheIsFresh && (!forceRefresh || now - lastFetchAttempt < MIN_REFRESH_INTERVAL_MS)) {
    return priceResponse({ ...cachedPrice, source: "server-cache" });
  }

  lastFetchAttempt = now;
  const apiKey = process.env.COINGECKO_API_KEY;
  const plan = process.env.COINGECKO_API_PLAN === "pro" ? "pro" : "demo";
  const baseUrl = plan === "pro" ? "https://pro-api.coingecko.com/api/v3" : "https://api.coingecko.com/api/v3";
  const headers: HeadersInit = {};
  if (apiKey) headers[plan === "pro" ? "x-cg-pro-api-key" : "x-cg-demo-api-key"] = apiKey;

  try {
    const response = await fetch(
      `${baseUrl}/simple/price?ids=internet-computer&vs_currencies=usd,nok&include_24hr_change=true&include_last_updated_at=true`,
      { headers, next: { revalidate: 60 } },
    );
    if (!response.ok) throw new Error(`CoinGecko svarte med ${response.status}.`);

    const payload = (await response.json()) as CoinGeckoResponse;
    const value = payload["internet-computer"];
    if (!value?.usd || !value.nok || !value.last_updated_at) throw new Error("CoinGecko-responsen mangler prisdata.");

    cachedPrice = {
      usd: String(value.usd),
      nok: String(value.nok),
      usd24hChange: String(value.usd_24h_change ?? 0),
      nok24hChange: String(value.nok_24h_change ?? 0),
      lastUpdatedAt: new Date(value.last_updated_at * 1000).toISOString(),
      fetchedAt: new Date().toISOString(),
      source: "live",
    };
    return priceResponse(cachedPrice);
  } catch (error) {
    if (cachedPrice) return priceResponse({ ...cachedPrice, source: "server-cache" });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Livepris er midlertidig utilgjengelig." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
