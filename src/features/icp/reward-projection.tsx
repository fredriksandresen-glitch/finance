import { Calculator, Info, Sparkles } from "lucide-react";
import { calculateRewardProjection, formatFiat, formatIcp } from "@/features/icp/calculations";
import type { IcpPortfolio } from "@/features/icp/types";

type ChangePortfolio = <K extends keyof IcpPortfolio>(field: K, value: IcpPortfolio[K]) => void;

const fieldClass =
  "h-10 w-full rounded-md border border-white/10 bg-black/25 px-3 text-sm text-zinc-100 outline-none focus:border-cyan-400/60";
const labels = { day: "1 dag", week: "1 uke", month: "1 måned", year: "1 år" } as const;

function DecimalField({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string;
  value: string;
  suffix: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm text-zinc-300">
      <span>{label}</span>
      <div className="relative">
        <input
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${fieldClass} pr-14`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-zinc-500">
          {suffix}
        </span>
      </div>
    </label>
  );
}

export function RewardProjection({
  portfolio,
  livePrice,
  onLivePriceChange,
  onChange,
}: {
  portfolio: IcpPortfolio;
  livePrice: string;
  onLivePriceChange: (value: string) => void;
  onChange: ChangePortfolio;
}) {
  const rows = calculateRewardProjection(portfolio, livePrice);
  const compoundingEnabled = portfolio.compoundingMode !== "none";

  return (
    <section
      className="rounded-lg border border-white/10 bg-white/[0.035] p-5 sm:p-6"
      aria-labelledby="reward-projection-heading"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-md bg-emerald-400/10 p-2 text-emerald-300">
            <Calculator size={19} />
          </div>
          <div>
            <h2 id="reward-projection-heading" className="text-xl font-semibold">
              Reward projection
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Rediger forutsetninger og sammenlign reward ved live og fremtidig pris.
            </p>
          </div>
        </div>
        <span className="w-fit rounded-md border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-1.5 text-xs text-emerald-300">
          Presise desimalberegninger
        </span>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-5">
          <fieldset>
            <legend className="text-sm font-medium text-zinc-200">Reward-modell</legend>
            <div className="mt-2 grid grid-cols-2 gap-1 rounded-md border border-white/10 bg-black/20 p-1">
              {[
                { value: "walletForecast", label: "Wallet-prognose" },
                { value: "rewardRate", label: "Reward-rate" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded px-3 py-2 text-center text-xs font-medium ${portfolio.rewardCalculationMode === option.value ? "bg-white text-zinc-950" : "text-zinc-400"}`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    checked={portfolio.rewardCalculationMode === option.value}
                    onChange={() =>
                      onChange("rewardCalculationMode", option.value as IcpPortfolio["rewardCalculationMode"])
                    }
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <DecimalField
              label="Låst ICP"
              value={portfolio.lockedIcp}
              suffix="ICP"
              onChange={(value) => onChange("lockedIcp", value)}
            />
            <DecimalField
              label="Staket maturity"
              value={portfolio.stakedMaturity}
              suffix="ICP"
              onChange={(value) => onChange("stakedMaturity", value)}
            />
            <DecimalField
              label="Årlig reward-rate"
              value={portfolio.annualRewardRatePercent}
              suffix="%"
              onChange={(value) => onChange("annualRewardRatePercent", value)}
            />
            <DecimalField
              label="Walletens 1-årsprognose"
              value={portfolio.walletAnnualForecastIcp}
              suffix="ICP"
              onChange={(value) => onChange("walletAnnualForecastIcp", value)}
            />
            <DecimalField
              label={`Live ICP-pris (${portfolio.preferredCurrency})`}
              value={livePrice}
              suffix={portfolio.preferredCurrency}
              onChange={onLivePriceChange}
            />
            <DecimalField
              label="Egendefinert fremtidig pris"
              value={portfolio.customIcpPrice}
              suffix={portfolio.preferredCurrency}
              onChange={(value) => onChange("customIcpPrice", value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-zinc-300">
              Valuta
              <select
                value={portfolio.preferredCurrency}
                onChange={(event) =>
                  onChange("preferredCurrency", event.target.value as IcpPortfolio["preferredCurrency"])
                }
                className={fieldClass}
              >
                <option value="USD">USD</option>
                <option value="NOK">NOK</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm text-zinc-300">
              Compounding
              <select
                disabled={!compoundingEnabled}
                value={compoundingEnabled ? portfolio.compoundingMode : "monthly"}
                onChange={(event) => onChange("compoundingMode", event.target.value as IcpPortfolio["compoundingMode"])}
                className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-40`}
              >
                <option value="monthly">Månedlig</option>
                <option value="daily">Daglig</option>
              </select>
            </label>
          </div>

          <label className="flex items-start gap-3 rounded-md border border-white/10 bg-black/20 p-4">
            <input
              type="checkbox"
              checked={compoundingEnabled}
              onChange={(event) => onChange("compoundingMode", event.target.checked ? "monthly" : "none")}
              className="mt-0.5 size-4 accent-emerald-400"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-200">Simuler auto-staking av nye rewards</span>
              <span className="mt-1 block text-xs leading-5 text-zinc-500">
                Avansert simulering. Resultatet er ikke en garantert prognose.
              </span>
            </span>
          </label>

          <div className="flex gap-3 rounded-md border border-cyan-400/15 bg-cyan-400/[0.04] p-4 text-xs leading-5 text-zinc-400">
            <Info className="mt-0.5 shrink-0 text-cyan-300" size={15} />
            <p>
              {portfolio.rewardCalculationMode === "walletForecast"
                ? "Wallet-prognosen brukes direkte og er standard fordi den samsvarer best med NNS-walleten."
                : "Reward-rate kan være avrundet. Estimatet kan derfor avvike fra walletens faktiske årsprognose."}
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead className="bg-white/[0.05] text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Periode</th>
                  <th className="px-4 py-3 font-medium">Reward i ICP</th>
                  <th className="px-4 py-3 font-medium">Verdi ved livepris</th>
                  <th className="px-4 py-3 font-medium">Verdi ved egendefinert pris</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.period} className="border-t border-white/8">
                    <td className="px-4 py-4 font-medium text-zinc-200">{labels[row.period]}</td>
                    <td className="px-4 py-4 font-semibold text-emerald-300">
                      {formatIcp(row.rewardIcp, row.period === "day" || row.period === "week" ? 4 : 2, 4)}
                    </td>
                    <td className="px-4 py-4 text-zinc-300">
                      {formatFiat(row.liveFiatValue, portfolio.preferredCurrency)}
                    </td>
                    <td className="px-4 py-4 text-amber-300">
                      {formatFiat(row.customFiatValue, portfolio.preferredCurrency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-start gap-3 rounded-md border border-emerald-400/15 bg-emerald-400/[0.04] p-4">
            <Sparkles className="mt-0.5 shrink-0 text-emerald-300" size={16} />
            <p className="text-xs leading-5 text-zinc-400">
              Endring av ICP-pris påvirker bare fiatverdien. Reward i ICP bestemmes av valgt reward-modell og eventuell
              aktivert compounding.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
