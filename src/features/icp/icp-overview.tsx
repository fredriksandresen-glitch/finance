import { Clock3, Coins, Landmark, LockKeyhole, WalletCards } from "lucide-react";
import {
  calculateEffectiveRewardStake,
  calculateRewardForPeriod,
  calculateTotalEstimatedHoldings,
  decimal,
  formatFiat,
  formatIcp,
  formatIcpNumber,
  formatIcpPercent,
} from "@/features/icp/calculations";
import type { IcpMarketPrice, IcpPortfolio } from "@/features/icp/types";

function Metric({
  label,
  value,
  detail,
  accent = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  accent?: "neutral" | "green" | "cyan" | "amber";
}) {
  const tones = {
    neutral: "text-white",
    green: "text-emerald-300",
    cyan: "text-cyan-300",
    amber: "text-amber-300",
  };
  return (
    <div className="min-h-32 rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-medium uppercase text-zinc-500">{label}</p>
      <p className={`mt-3 text-xl font-semibold sm:text-2xl ${tones[accent]}`}>{value}</p>
      <p className="mt-2 text-xs text-zinc-500">{detail}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/8 py-3 last:border-0">
      <dt className="text-sm text-zinc-400">{label}</dt>
      <dd className="text-right text-sm font-medium text-zinc-100">{value}</dd>
    </div>
  );
}

export function IcpOverview({
  portfolio,
  marketPrice,
  livePrice,
}: {
  portfolio: IcpPortfolio;
  marketPrice: IcpMarketPrice | null;
  livePrice: string;
}) {
  const total = calculateTotalEstimatedHoldings(portfolio);
  const effectiveStake = calculateEffectiveRewardStake(portfolio.lockedIcp, portfolio.stakedMaturity);
  const annualReward = calculateRewardForPeriod(portfolio, "year");
  const dailyReward = calculateRewardForPeriod(portfolio, "day");
  const marketValue = total.mul(decimal(livePrice || "0"));
  const currency = portfolio.preferredCurrency;
  const priceChange = marketPrice
    ? decimal(currency === "USD" ? marketPrice.usd24hChange : marketPrice.nok24hChange)
    : decimal(0);
  const availablePct = total.isZero() ? 0 : decimal(portfolio.availableIcp).div(total).mul(100).toNumber();
  const lockedPct = total.isZero() ? 0 : decimal(portfolio.lockedIcp).div(total).mul(100).toNumber();
  const distribution = `conic-gradient(#22c55e 0 ${availablePct}%, #38bdf8 ${availablePct}% ${availablePct + lockedPct}%, #f59e0b ${availablePct + lockedPct}% 100%)`;

  return (
    <div className="space-y-6">
      <section aria-labelledby="icp-key-metrics">
        <h2 id="icp-key-metrics" className="sr-only">
          Nøkkeltall
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric
            label="Total estimert beholdning"
            value={formatIcp(total)}
            detail="Wallet + låst + staket maturity"
            accent="cyan"
          />
          <Metric
            label="Tilgjengelig"
            value={formatIcp(portfolio.availableIcp)}
            detail="Likvid ICP i wallet"
            accent="green"
          />
          <Metric
            label="Låst i neuron"
            value={formatIcp(portfolio.lockedIcp)}
            detail={`${portfolio.neuronCount} neuron`}
          />
          <Metric
            label="Staket maturity"
            value={formatIcp(portfolio.stakedMaturity)}
            detail="Ikke likvid, men reward-genererende"
            accent="amber"
          />
          <Metric
            label="Reward-genererende saldo"
            value={formatIcp(effectiveStake)}
            detail="Låst ICP + staket maturity"
            accent="green"
          />
          <Metric
            label={`Live ICP-pris (${currency})`}
            value={livePrice ? formatFiat(livePrice, currency, 4) : "Ikke tilgjengelig"}
            detail={
              marketPrice
                ? `${priceChange.greaterThanOrEqualTo(0) ? "+" : ""}${formatIcpNumber(priceChange, 2, 2)} % siste 24 t`
                : "Venter på markedsdata"
            }
            accent="cyan"
          />
          <Metric
            label="Total markedsverdi"
            value={formatFiat(marketValue, currency)}
            detail="Estimert totalbeholdning × livepris"
          />
          <Metric
            label="Reward-rate"
            value={`${formatIcpNumber(portfolio.annualRewardRatePercent)} %`}
            detail={
              portfolio.rewardCalculationMode === "walletForecast"
                ? "Wallet-prognose brukes som grunnlag"
                : "Estimert fra vist reward-rate"
            }
            accent="green"
          />
          <Metric
            label="Årlig reward-prognose"
            value={formatIcp(annualReward)}
            detail={portfolio.compoundingMode === "none" ? "Lineær prognose" : "Simulert med compounding"}
            accent="green"
          />
          <Metric
            label="Daglig reward-prognose"
            value={formatIcp(dailyReward, 4, 4)}
            detail="Pris påvirker bare fiatverdien"
            accent="green"
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]" aria-labelledby="total-assets-heading">
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Coins className="text-cyan-300" size={20} />
            <div>
              <h2 id="total-assets-heading" className="text-lg font-semibold">
                Total assets
              </h2>
              <p className="text-sm text-zinc-500">Fordeling av estimert ICP-beholdning</p>
            </div>
          </div>
          <div className="mt-6 grid items-center gap-8 sm:grid-cols-[180px_1fr]">
            <div
              className="relative mx-auto size-44 rounded-full"
              style={{ background: distribution }}
              aria-label="Fordeling av ICP-beholdning"
            >
              <div className="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-[#0b0d11] text-center">
                <span className="text-xs text-zinc-500">Totalt</span>
                <strong className="mt-1 text-lg">{formatIcpNumber(total)}</strong>
                <span className="text-xs text-zinc-500">ICP</span>
              </div>
            </div>
            <dl className="space-y-4">
              {[
                { color: "bg-emerald-400", label: "Tilgjengelig", value: portfolio.availableIcp },
                { color: "bg-cyan-400", label: "Låst i neuron", value: portfolio.lockedIcp },
                { color: "bg-amber-400", label: "Staket maturity", value: portfolio.stakedMaturity },
              ].map((item) => (
                <div key={item.label} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                  <span className={`size-2.5 rounded-full ${item.color}`} />
                  <dt className="text-sm text-zinc-400">{item.label}</dt>
                  <dd className="text-right text-sm font-medium">{formatIcpPercent(item.value, total)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="rounded-lg border border-amber-400/20 bg-amber-400/[0.05] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <LockKeyhole className="text-amber-300" size={20} />
            <h2 className="text-lg font-semibold">Likviditet og reward-grunnlag</h2>
          </div>
          <p className="mt-4 text-sm leading-6 text-zinc-300">
            Staket maturity inngår i estimert totalbeholdning og øker reward-genererende saldo. Den er ikke tilgjengelig
            for uttak som likvid ICP.
          </p>
          <div className="mt-5 rounded-md border border-white/10 bg-black/20 p-4 font-mono text-sm text-zinc-300">
            {formatIcp(portfolio.lockedIcp)} + {formatIcp(portfolio.stakedMaturity)} ={" "}
            <span className="text-emerald-300">{formatIcp(effectiveStake)}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/[0.04] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <WalletCards className="text-emerald-300" size={20} />
              <h2 className="text-lg font-semibold">Available</h2>
            </div>
            <span className="rounded-md bg-emerald-400/10 px-2 py-1 text-xs font-medium text-emerald-300">Likvid</span>
          </div>
          <p className="mt-6 text-3xl font-semibold text-emerald-200">{formatIcp(portfolio.availableIcp)}</p>
          <dl className="mt-5">
            <DetailRow
              label="Verdi ved livepris"
              value={formatFiat(decimal(portfolio.availableIcp).mul(decimal(livePrice || "0")), currency)}
            />
            <DetailRow label="Andel av total" value={formatIcpPercent(portfolio.availableIcp, total)} />
            <DetailRow
              label="Sist oppdatert"
              value={new Intl.DateTimeFormat("nb-NO", { dateStyle: "medium", timeStyle: "short" }).format(
                new Date(portfolio.updatedAt),
              )}
            />
          </dl>
          <button
            disabled
            className="mt-5 w-full cursor-not-allowed rounded-md border border-white/10 px-4 py-2 text-sm text-zinc-500"
          >
            Send ICP · kommer senere
          </button>
        </div>

        <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/[0.04] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Landmark className="text-cyan-300" size={20} />
            <h2 className="text-lg font-semibold">Locked in neurons</h2>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-zinc-500">Låst</p>
              <p className="mt-2 text-2xl font-semibold">{formatIcp(portfolio.lockedIcp)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-zinc-500">1-årsprognose</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">{formatIcp(annualReward)}</p>
            </div>
          </div>
          <dl className="mt-5">
            <DetailRow label="Neuron" value={`${portfolio.neuronCount}`} />
            <DetailRow label="Staket maturity" value={formatIcp(portfolio.stakedMaturity)} />
            <DetailRow label="Reward-genererende saldo" value={formatIcp(effectiveStake)} />
            <DetailRow label="Daglig prognose" value={formatIcp(dailyReward, 4, 4)} />
            <DetailRow label="Dissolve delay" value={`${portfolio.dissolveDelayMonths / 12} år`} />
            <DetailRow label="8-year gang bonus" value={portfolio.eightYearGangBonus ? "Aktiv" : "Ikke aktiv"} />
          </dl>
        </div>
      </section>

      {marketPrice ? (
        <p className="flex items-center gap-2 text-xs text-zinc-500">
          <Clock3 size={13} />
          CoinGecko sist oppdatert{" "}
          {new Intl.DateTimeFormat("nb-NO", { dateStyle: "medium", timeStyle: "short" }).format(
            new Date(marketPrice.lastUpdatedAt),
          )}
        </p>
      ) : null}
    </div>
  );
}
