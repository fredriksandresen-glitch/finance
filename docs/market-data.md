# Markedsdata for investeringer

## ICP

ICP-pris og 90 dagers historikk hentes direkte fra CoinGecko i NOK. Antallet kommer fra ICP-porteføljen og inkluderer tilgjengelig ICP, låst ICP og daglig opptjent staket maturity. Gjennomsnittlig kjøpspris på investering-siden er satt til 50 NOK.

## BMNR

Beholdningen er 700 aksjer med gjennomsnittlig kjøpspris 450 NOK. Vercel-funksjonen `api/bmnr.mjs` henter siste BMNR-pris og daglige sluttkurser fra Nasdaqs offentlige markedsdata. USD/NOK hentes fra Frankfurter og brukes til å vise hele beholdningen i NOK.

Canister-frontenden kaller funksjonen via:

```bash
NEXT_PUBLIC_MARKET_API_BASE_URL=https://finance-hazel-theta-99.vercel.app
```

Funksjonen sender CORS-headere og cacher svar i 60 sekunder. Frontend lagrer siste vellykkede respons i `localStorage` som fallback. Det brukes ingen API-nøkkel, og ingen hemmeligheter bygges inn i den statiske canister-frontenden.

Nasdaq-endepunktet er offentlig tilgjengelig, men ikke presentert som et kontraktsfestet utvikler-API. Hvis stabiliteten blir utilstrekkelig, kan `InvestmentMarketService` byttes til en betalt leverandør uten å endre UI-et. Alpha Vantage har et dokumentert quote-API, men sanntidsdata for amerikanske aksjer krever API-nøkkel og betalt tilgang.
