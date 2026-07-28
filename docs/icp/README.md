# ICP-integrasjon

Første MVP bruker lokal mock-data. Mainnet-canisteren `tymvd-6aaaa-aaaam-qjbza-cai` skal ikke deployes til i denne runden.

## Miljøvariabler

```bash
NEXT_PUBLIC_ICP_CANISTER_ID=tymvd-6aaaa-aaaam-qjbza-cai
NEXT_PUBLIC_ICP_NETWORK=local
```

`NEXT_PUBLIC_ICP_CANISTER_ID` kan leses av frontend på Vercel. Ikke legg private nøkler, seed phrases, controller-identiteter eller andre hemmeligheter i Git eller Vercel.

## Data som bør lagres i canisteren

- `Portfolio`
- `Asset`
- `Transaction`
- `Liability`
- `NetWorthSnapshot`
- `IncomeExpenseEntry`
- `UserSettings`

Mock-repositoryet i `src/lib/repositories` bør senere få en `IcpPortfolioRepository` med samme kontrakt som `PortfolioRepository`.

## ICP reward-dashboard

Feature-branchen legger til en egen `/icp`-side med wallet-balanse, neuron-staking, staket maturity og reward-prognoser. Finansielle verdier lagres som normaliserte desimalstrenger og beregnes med `decimal.js`.

I preview brukes `BrowserIcpRepository`, som lagrer manuelt registrerte ICP-verdier og sist gyldige markedspris i nettleserens localStorage. `IcpCanisterPortfolioRepository` har samme kontrakt og er opprettet som adapterpunkt, men mainnet-kall er ikke aktivert uten egen godkjenning.

Det foreslåtte Candid-grensesnittet for reward-data ligger i [`rewards.did`](./rewards.did) og dekker:

- `getIcpPortfolio`
- `updateIcpPortfolio`
- `getLastMarketPrice`
- `saveLastMarketPrice`

Canisteren bør lagre data per autentisert `principal`. Decimalverdier lagres som `text` og valideres/normaliseres ved canistergrensen for å unngå tap fra `float64`.

Automatisk wallet- og neuron-synkronisering er eksplisitt utsatt. Senere kan en NNS-adapter implementere lesing av wallet-balanse, låst ICP, staket maturity, dissolve delay og walletens reward-prognose uten å endre UI-kontraktene.

## CoinGecko

`/api/icp-price` er et servermellomlag for CoinGecko-ID-en `internet-computer`. Ruten henter USD og NOK, 24-timersendring og siste oppdatering, og bruker 60 sekunders servercache med minst 20 sekunder mellom tvungne oppdateringer.

```bash
COINGECKO_API_KEY=
COINGECKO_API_PLAN=demo
```

API-nøkkelen er valgfri for lokal utprøving og må aldri prefikses med `NEXT_PUBLIC_`. Sett `COINGECKO_API_PLAN=pro` bare dersom nøkkelen tilhører Pro-endepunktet. Ved feil brukes varm servercache eller sist lagrede pris i nettleseren. Når canisterrepositoryet aktiveres, flyttes prisfallbacken til stabil canisterlagring.

## Forslag til Candid-grensesnitt

```did
type Currency = variant { NOK; USD; EUR; GBP; SEK; DKK };
type AssetCategory = variant { aksjer; krypto; fond; kontanter; eiendom; andre };
type IncomeExpenseType = variant { income; expense };

type Asset = record {
  id : text;
  name : text;
  symbol : text;
  category : AssetCategory;
  quantity : float64;
  purchasePrice : float64;
  currentPrice : float64;
  currency : Currency;
  lastUpdated : text;
};

type Liability = record {
  id : text;
  name : text;
  amount : float64;
  interestRate : float64;
  currency : Currency;
  dueDate : opt text;
};

type IncomeExpenseEntry = record {
  id : text;
  amount : float64;
  date : text;
  category : text;
  description : text;
  type : IncomeExpenseType;
  cadence : variant { fixed; variable };
  recurrence : variant { recurring; one_off };
};

type NetWorthSnapshot = record {
  id : text;
  date : text;
  assets : float64;
  liabilities : float64;
  netWorth : float64;
};

type Portfolio = record {
  id : text;
  ownerName : text;
  assets : vec Asset;
  liabilities : vec Liability;
  netWorthSnapshots : vec NetWorthSnapshot;
  incomeExpenseEntries : vec IncomeExpenseEntry;
};

service : {
  getPortfolio : () -> (opt Portfolio) query;
  upsertAsset : (Asset) -> (Asset);
  deleteAsset : (text) -> (bool);
  addIncomeExpenseEntry : (IncomeExpenseEntry) -> (IncomeExpenseEntry);
  addNetWorthSnapshot : (NetWorthSnapshot) -> (NetWorthSnapshot);
  exportPortfolio : () -> (Portfolio) query;
}
```

## Internet Identity

Frontend kan bruke `@dfinity/auth-client` for innlogging. Etter innlogging sendes kall gjennom en actor opprettet med identiteten fra Internet Identity. Canisteren bør mappe `principal` til brukerens portefølje og nekte tilgang til andre principaler.

## Vercel til canister

Vercel-hostet Next.js kan kalle ICP direkte fra klienten med agent/actor når canister-ID og nettverk er satt. For offentlig lesbar mock/preview kan `NEXT_PUBLIC_ICP_NETWORK=local` brukes lokalt og `ic` i preview/produksjon når mainnet-integrasjonen aktiveres.
