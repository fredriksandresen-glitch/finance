# Finansoversikt

Første fungerende MVP for en personlig webapp som samler økonomi, investeringer, gjeld, kontantstrøm og nettoformue.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-inspirerte lokale komponenter
- Recharts
- Zod
- ESLint, Prettier og Vitest

## Lokal installasjon

```bash
pnpm install
pnpm dev
```

Åpne `http://localhost:3000`.

## Miljøvariabler

Kopier `.env.example` til `.env.local` ved lokal kjøring:

```bash
NEXT_PUBLIC_ICP_CANISTER_ID=tymvd-6aaaa-aaaam-qjbza-cai
NEXT_PUBLIC_ICP_NETWORK=local
COINGECKO_API_KEY=
COINGECKO_API_PLAN=demo
```

Ikke legg private nøkler, seed phrases, controller-identiteter eller hemmeligheter i GitHub eller Vercel.

## Arkitektur

UI-et leser ikke mock-data direkte. Data flyter slik:

`src/lib/mock` -> `src/lib/repositories` -> `src/lib/services` -> `src/app` og `src/features`

Viktige domeneobjekter ligger i `src/lib/types.ts`:

- `Portfolio`
- `Asset`
- `Transaction`
- `Liability`
- `NetWorthSnapshot`
- `IncomeExpenseEntry`
- `UserSettings`

Når ICP kobles på, kan `MockPortfolioRepository` erstattes eller suppleres med `IcpPortfolioRepository` uten stor omskriving av UI.

## Sider

- Dashboard: nettoformue, endring siste måned/YTD, eiendeler, gjeld, inntekt, utgifter, grafer, største beholdninger og nylige registreringer.
- Investeringer: manuell registrering av aksjer, krypto, fond, kontanter, eiendom og andre investeringer.
- Inntekter og utgifter: manuelle poster med kategori, type, fast/variabel og gjentakende/enkeltstående.
- Nettoformue: historisk utvikling med intervaller for 1 måned, 6 måneder, 1 år og hele perioden.
- ICP: wallet, neuron-staking, staket maturity, CoinGecko-livepris og presise reward-prognoser med valgfri compounding.
- Innstillinger: valuta, tema, import/eksport-plassholdere, Internet Identity-plass og ICP-canister-konfigurasjon.

## Kvalitetssjekker

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Vercel-deploy

Prosjektet er en standard Next.js-app og kan deployes direkte fra GitHub i Vercel:

- Framework preset: Next.js
- Build command: `pnpm build`
- Install command: `pnpm install`
- Environment variable: `NEXT_PUBLIC_ICP_CANISTER_ID=tymvd-6aaaa-aaaam-qjbza-cai`
- Optional server variable: `COINGECKO_API_KEY` (må ikke eksponeres med `NEXT_PUBLIC_`)

## ICP-plan

Se `docs/icp/README.md` for canister-ID, foreslått Candid-grensesnitt, hvilke data som bør lagres i canisteren, Internet Identity-plan og hvordan Vercel-frontend senere kan kommunisere med canisteren.
