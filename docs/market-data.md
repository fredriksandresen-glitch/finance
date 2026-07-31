# Markedsdata for investeringer

## ICP

ICP-pris og 90 dagers historikk hentes direkte fra CoinGecko i NOK. Antallet kommer fra ICP-porteføljen og inkluderer tilgjengelig ICP, låst ICP og daglig opptjent staket maturity. Gjennomsnittlig kjøpspris på investeringssiden er satt til 50 NOK.

## Aksjer

Følgende beholdninger vises i NOK:

- BMNR: 700 aksjer, gjennomsnittlig kjøpspris 450 NOK.
- SBET: 653 aksjer, gjennomsnittlig kjøpspris 207 NOK.
- MSTR: 9 aksjer, gjennomsnittlig kjøpspris 3 903 NOK.

Vercel-funksjonen `api/stocks.mjs` bruker Finnhub som førstevalg for dagens USD-kurs. Finnhub-nøkkelen ligger kun i servermiljøvariabelen `FINNHUB_API_KEY`. Nasdaq brukes til historiske sluttkurser og som reserve for dagens pris. USD/NOK hentes fra Frankfurter.

Canister-frontenden kaller funksjonen via:

```bash
NEXT_PUBLIC_MARKET_API_BASE_URL=https://finance-hazel-theta-99.vercel.app
```

Funksjonen sender CORS-headere og cacher svar i 60 sekunder. Frontend lagrer siste vellykkede respons i `localStorage`. Dersom en leverandør eller hele endepunktet feiler, brukes tidligere lagrede data per symbol, og UI-et merker kursen som `Lagret` eller `Ikke live`.

Finnhubs quote-endepunkt gir dagens amerikanske aksjekurs. Historiske stock candles krever premiumabonnement, derfor beholdes Nasdaq som historikkilde. Ingen API-nøkkel bygges inn i den statiske canister-frontenden.
