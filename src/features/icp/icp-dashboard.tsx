"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Database, RefreshCw, Save, TriangleAlert } from "lucide-react";
import { formatFiat } from "@/features/icp/calculations";
import { IcpOverview } from "@/features/icp/icp-overview";
import { RewardProjection } from "@/features/icp/reward-projection";
import { defaultIcpPortfolio, type IcpMarketPrice, type IcpPortfolio } from "@/features/icp/types";
import { ICP_CANISTER_ID } from "@/lib/icp/config";
import { icpPortfolioService } from "@/lib/services/icp-portfolio-service";

export function IcpDashboard() {
  const [portfolio, setPortfolio] = useState<IcpPortfolio>(defaultIcpPortfolio);
  const [marketPrice, setMarketPrice] = useState<IcpMarketPrice | null>(null);
  const [livePrice, setLivePrice] = useState("");
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceError, setPriceError] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");

  const selectPrice = useCallback((price: IcpMarketPrice, currency: IcpPortfolio["preferredCurrency"]) => {
    setLivePrice(currency === "USD" ? price.usd : price.nok);
  }, []);

  const fetchPrice = useCallback(
    async (force = false, currency: IcpPortfolio["preferredCurrency"] = "USD") => {
      setPriceLoading(true);
      setPriceError("");
      try {
        const response = await fetch(`/api/icp-price${force ? "?refresh=1" : ""}`);
        if (!response.ok) throw new Error((await response.json()).message ?? "Livepris er utilgjengelig.");
        const price = (await response.json()) as IcpMarketPrice;
        setMarketPrice(price);
        selectPrice(price, currency);
        await icpPortfolioService.saveLastMarketPrice(price);
      } catch (error) {
        const fallback = await icpPortfolioService.getLastMarketPrice();
        if (fallback) {
          const localFallback = { ...fallback, source: "local-fallback" as const };
          setMarketPrice(localFallback);
          selectPrice(localFallback, currency);
          setPriceError("Livepris kunne ikke hentes. Viser sist lagrede pris.");
        } else {
          setPriceError(error instanceof Error ? error.message : "Livepris er midlertidig utilgjengelig.");
        }
      } finally {
        setPriceLoading(false);
      }
    },
    [selectPrice],
  );

  useEffect(() => {
    let active = true;
    async function initialize() {
      const stored = await icpPortfolioService.getPortfolio();
      if (!active) return;
      setPortfolio(stored);
      await fetchPrice(false, stored.preferredCurrency);
    }
    void initialize();
    return () => {
      active = false;
    };
  }, [fetchPrice]);

  function updatePortfolio<K extends keyof IcpPortfolio>(field: K, value: IcpPortfolio[K]) {
    setPortfolio((current) => ({ ...current, [field]: value }));
    setSaveState("idle");
    if (field === "preferredCurrency" && marketPrice)
      selectPrice(marketPrice, value as IcpPortfolio["preferredCurrency"]);
  }

  async function savePortfolio() {
    try {
      const saved = await icpPortfolioService.updatePortfolio(portfolio);
      setPortfolio(saved);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-black/10 bg-[#090b0f] text-zinc-100 shadow-sm dark:border-white/10">
      <header className="border-b border-white/10 bg-[#0d1015] px-5 py-6 sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-cyan-300">
              <span className="size-2 rounded-full bg-cyan-300" />
              Internet Computer
            </div>
            <h1 className="mt-3 text-3xl font-semibold">ICP-portefølje</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              Wallet, neuron-staking, staket maturity og reward-prognoser samlet i én presis oversikt.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void fetchPrice(true, portfolio.preferredCurrency)}
              disabled={priceLoading}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 px-3 text-sm font-medium text-zinc-300 hover:bg-white/5 disabled:opacity-50"
              title="Oppdater CoinGecko-pris"
            >
              <RefreshCw size={16} className={priceLoading ? "animate-spin" : ""} />
              Oppdater pris
            </button>
            <button
              onClick={() => void savePortfolio()}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-400 px-4 text-sm font-semibold text-emerald-950 hover:bg-emerald-300"
            >
              <Save size={16} />
              Lagre innstillinger
            </button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-2">
            <Database size={13} />
            Preview-lagring: lokal repository
          </span>
          <span>
            Canister: <span className="font-mono text-zinc-400">{ICP_CANISTER_ID}</span>
          </span>
          {marketPrice ? <span>Livepris: {formatFiat(livePrice || "0", portfolio.preferredCurrency, 4)}</span> : null}
          {saveState === "saved" ? (
            <span className="inline-flex items-center gap-1 text-emerald-300">
              <Check size={13} />
              Lagret lokalt
            </span>
          ) : null}
          {saveState === "error" ? <span className="text-rose-300">Kontroller tallformatet.</span> : null}
        </div>
        {priceError ? (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2 text-xs text-amber-200">
            <TriangleAlert className="mt-0.5 shrink-0" size={14} />
            {priceError}
          </div>
        ) : null}
      </header>

      <div className="space-y-6 p-4 sm:p-6 lg:p-7">
        <IcpOverview portfolio={portfolio} marketPrice={marketPrice} livePrice={livePrice} />
        <RewardProjection
          portfolio={portfolio}
          livePrice={livePrice}
          onLivePriceChange={setLivePrice}
          onChange={updatePortfolio}
        />

        <section
          className="rounded-lg border border-white/10 bg-white/[0.03] p-5 sm:p-6"
          aria-labelledby="governance-settings-heading"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 id="governance-settings-heading" className="text-lg font-semibold">
                Neuron og governance
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Manuelle startverdier. Automatisk NNS-synkronisering kommer senere.
              </p>
            </div>
            <span className="rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-500">Manuell</span>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="grid gap-2 text-sm text-zinc-300">
              Tilgjengelig ICP
              <input
                inputMode="decimal"
                value={portfolio.availableIcp}
                onChange={(event) => updatePortfolio("availableIcp", event.target.value)}
                className="h-10 rounded-md border border-white/10 bg-black/25 px-3 outline-none focus:border-cyan-400/60"
              />
            </label>
            <label className="grid gap-2 text-sm text-zinc-300">
              Antall neurons
              <input
                type="number"
                min="0"
                value={portfolio.neuronCount}
                onChange={(event) => updatePortfolio("neuronCount", Number(event.target.value))}
                className="h-10 rounded-md border border-white/10 bg-black/25 px-3 outline-none focus:border-cyan-400/60"
              />
            </label>
            <label className="grid gap-2 text-sm text-zinc-300">
              Dissolve delay (måneder)
              <input
                type="number"
                min="0"
                value={portfolio.dissolveDelayMonths}
                onChange={(event) => updatePortfolio("dissolveDelayMonths", Number(event.target.value))}
                className="h-10 rounded-md border border-white/10 bg-black/25 px-3 outline-none focus:border-cyan-400/60"
              />
            </label>
            <div className="grid gap-3 pt-1 text-sm text-zinc-300">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={portfolio.eightYearGangBonus}
                  onChange={(event) => updatePortfolio("eightYearGangBonus", event.target.checked)}
                  className="size-4 accent-cyan-400"
                />
                8-year gang bonus aktiv
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={portfolio.autoStakeMaturity}
                  onChange={(event) => updatePortfolio("autoStakeMaturity", event.target.checked)}
                  className="size-4 accent-emerald-400"
                />
                Maturity auto-staket
              </label>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
