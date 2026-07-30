type NasdaqInfoResponse = {
  data?: {
    companyName?: string;
    primaryData?: {
      lastSalePrice?: string;
      percentageChange?: string;
      lastTradeTimestamp?: string;
    };
  };
};

type NasdaqHistoryResponse = {
  data?: {
    tradesTable?: {
      rows?: Array<{ date?: string; close?: string }>;
    };
  };
};

type FrankfurterResponse = {
  date?: string;
  rates?: Record<string, { NOK?: number }> | { NOK?: number };
};

export const revalidate = 60;

const responseHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: responseHeaders });
}

function numberFromMarketValue(value?: string) {
  const parsed = Number(value?.replaceAll("$", "").replaceAll("%", "").replaceAll(",", "").trim());
  if (!Number.isFinite(parsed)) throw new Error("Nasdaq-responsen mangler gyldig pris.");
  return parsed;
}

function nasdaqDateToIso(value?: string) {
  const [month, day, year] = value?.split("/") ?? [];
  if (!year || !month || !day) throw new Error("Nasdaq-responsen mangler gyldig dato.");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function latestRateOnOrBefore(rates: Map<string, number>, date: string, fallback: number) {
  const match = [...rates.entries()].toSorted(([a], [b]) => a.localeCompare(b)).findLast(([key]) => key <= date);
  return match?.[1] ?? fallback;
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: responseHeaders });
}

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const fromDate = new Date(Date.now() - 100 * 86_400_000).toISOString().slice(0, 10);
    const nasdaqHeaders = {
      Accept: "application/json, text/plain, */*",
      "User-Agent": "Mozilla/5.0 (compatible; FinanceOversikt/1.0)",
    };
    const [infoResponse, historyResponse, fxResponse] = await Promise.all([
      fetch("https://api.nasdaq.com/api/quote/BMNR/info?assetclass=stocks", { headers: nasdaqHeaders }),
      fetch(`https://api.nasdaq.com/api/quote/BMNR/historical?assetclass=stocks&fromdate=${fromDate}&limit=120`, {
        headers: nasdaqHeaders,
      }),
      fetch(`https://api.frankfurter.app/${fromDate}..${today}?from=USD&to=NOK`),
    ]);

    if (!infoResponse.ok || !historyResponse.ok || !fxResponse.ok) {
      throw new Error("En av markedsdatakildene svarte ikke.");
    }

    const info = (await infoResponse.json()) as NasdaqInfoResponse;
    const history = (await historyResponse.json()) as NasdaqHistoryResponse;
    const fx = (await fxResponse.json()) as FrankfurterResponse;
    const fxEntries = Object.entries(fx.rates ?? {}).filter((entry): entry is [string, { NOK: number }] => {
      return typeof entry[1] === "object" && entry[1] !== null && Number.isFinite(entry[1].NOK);
    });
    const rates = new Map(fxEntries.map(([date, value]) => [date, value.NOK]));
    const usdNok = latestRateOnOrBefore(rates, today, 0);
    if (!usdNok) throw new Error("Valutakilden mangler USD/NOK-kurs.");

    const primary = info.data?.primaryData;
    const priceUsd = numberFromMarketValue(primary?.lastSalePrice);
    const rows = history.data?.tradesTable?.rows ?? [];
    const historyPoints = rows
      .map((row) => {
        const date = nasdaqDateToIso(row.date);
        const closeUsd = numberFromMarketValue(row.close);
        return {
          date,
          closeUsd,
          closeNok: closeUsd * latestRateOnOrBefore(rates, date, usdNok),
        };
      })
      .toSorted((a, b) => a.date.localeCompare(b.date));

    const currentPoint = { date: today, closeUsd: priceUsd, closeNok: priceUsd * usdNok };
    const deduplicatedHistory = [...historyPoints.filter((point) => point.date !== today), currentPoint];

    return json({
      symbol: "BMNR",
      name: info.data?.companyName ?? "BitMine Immersion Technologies",
      priceUsd,
      priceNok: priceUsd * usdNok,
      usdNok,
      changePercent: numberFromMarketValue(primary?.percentageChange ?? "0"),
      lastUpdatedAt: new Date().toISOString(),
      source: "Nasdaq / Frankfurter",
      history: deduplicatedHistory,
    });
  } catch (error) {
    return json({ message: error instanceof Error ? error.message : "BMNR-prisen er utilgjengelig." }, 503);
  }
}
