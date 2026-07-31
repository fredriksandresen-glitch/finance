const stocks = [
  { symbol: "BMNR", name: "BitMine Immersion Technologies" },
  { symbol: "SBET", name: "SharpLink Gaming" },
  { symbol: "MSTR", name: "Strategy" },
];

const responseHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

function json(body, status = 200) {
  return Response.json(body, { status, headers: responseHeaders });
}

async function fetchJson(url, init) {
  try {
    const response = await fetch(url, init);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function numberFromMarketValue(value) {
  const parsed = Number(value?.replaceAll("$", "").replaceAll("%", "").replaceAll(",", "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function nasdaqDateToIso(value) {
  const [month, day, year] = value?.split("/") ?? [];
  if (!year || !month || !day) return null;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function latestRateOnOrBefore(rates, date, fallback) {
  const match = [...rates.entries()].toSorted(([a], [b]) => a.localeCompare(b)).findLast(([key]) => key <= date);
  return match?.[1] ?? fallback;
}

async function getFxRates(fromDate, today) {
  const timeSeries = await fetchJson(`https://api.frankfurter.app/${fromDate}..${today}?from=USD&to=NOK`);
  const entries = Object.entries(timeSeries?.rates ?? {}).filter((entry) => Number.isFinite(entry[1]?.NOK));
  const rates = new Map(entries.map(([date, value]) => [date, value.NOK]));
  let usdNok = latestRateOnOrBefore(rates, today, 0);

  if (!usdNok) {
    const latest = await fetchJson("https://api.frankfurter.app/latest?from=USD&to=NOK");
    usdNok = Number(latest?.rates?.NOK ?? 0);
    if (usdNok && latest?.date) rates.set(latest.date, usdNok);
  }

  return { rates, usdNok };
}

async function getFinnhubQuote(symbol) {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) return null;
  const quote = await fetchJson(`https://finnhub.io/api/v1/quote?symbol=${symbol}`, {
    headers: { "X-Finnhub-Token": token },
  });
  const priceUsd = Number(quote?.c ?? 0);
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) return null;
  return {
    priceUsd,
    changePercent: Number(quote?.dp ?? 0),
    lastUpdatedAt: quote?.t ? new Date(quote.t * 1000).toISOString() : new Date().toISOString(),
  };
}

async function getNasdaqData(stock, fromDate) {
  const headers = {
    Accept: "application/json, text/plain, */*",
    "User-Agent": "Mozilla/5.0 (compatible; FinanceOversikt/1.0)",
  };
  const [info, history] = await Promise.all([
    fetchJson(`https://api.nasdaq.com/api/quote/${stock.symbol}/info?assetclass=stocks`, { headers }),
    fetchJson(
      `https://api.nasdaq.com/api/quote/${stock.symbol}/historical?assetclass=stocks&fromdate=${fromDate}&limit=120`,
      { headers },
    ),
  ]);
  const primary = info?.data?.primaryData;
  const historyPoints = (history?.data?.tradesTable?.rows ?? [])
    .flatMap((row) => {
      const date = nasdaqDateToIso(row.date);
      const closeUsd = numberFromMarketValue(row.close);
      return date && closeUsd ? [{ date, closeUsd }] : [];
    })
    .toSorted((a, b) => a.date.localeCompare(b.date));

  return {
    name: info?.data?.companyName ?? stock.name,
    priceUsd: numberFromMarketValue(primary?.lastSalePrice) ?? historyPoints.at(-1)?.closeUsd ?? null,
    changePercent: numberFromMarketValue(primary?.percentageChange) ?? 0,
    lastUpdatedAt: new Date().toISOString(),
    history: historyPoints,
  };
}

async function getStock(stock, fromDate, today, rates, usdNok) {
  const [finnhub, nasdaq] = await Promise.all([getFinnhubQuote(stock.symbol), getNasdaqData(stock, fromDate)]);
  const priceUsd = finnhub?.priceUsd ?? nasdaq.priceUsd;
  if (!priceUsd) return null;

  const history = nasdaq.history.map((point) => ({
    ...point,
    closeNok: point.closeUsd * latestRateOnOrBefore(rates, point.date, usdNok),
  }));
  const currentPoint = { date: today, closeUsd: priceUsd, closeNok: priceUsd * usdNok };

  return {
    symbol: stock.symbol,
    name: nasdaq.name,
    priceUsd,
    priceNok: priceUsd * usdNok,
    changePercent: finnhub?.changePercent ?? nasdaq.changePercent,
    lastUpdatedAt: finnhub?.lastUpdatedAt ?? nasdaq.lastUpdatedAt,
    source: finnhub ? "Finnhub" : "Nasdaq",
    isLive: true,
    history: [...history.filter((point) => point.date !== today), currentPoint],
  };
}

const handler = {
  async fetch(request) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: responseHeaders });
    if (request.method !== "GET") return json({ message: "Metoden støttes ikke." }, 405);

    const today = new Date().toISOString().slice(0, 10);
    const fromDate = new Date(Date.now() - 100 * 86_400_000).toISOString().slice(0, 10);
    const { rates, usdNok } = await getFxRates(fromDate, today);
    if (!usdNok) return json({ message: "Valutakilden mangler USD/NOK-kurs." }, 503);

    const results = await Promise.all(stocks.map((stock) => getStock(stock, fromDate, today, rates, usdNok)));
    const availableStocks = results.filter(Boolean);
    if (availableStocks.length === 0) return json({ message: "Ingen aksjekurser er tilgjengelige." }, 503);

    return json({ stocks: availableStocks, usdNok, fetchedAt: new Date().toISOString() });
  },
};

export default handler;
