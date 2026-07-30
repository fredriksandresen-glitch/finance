"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/lib/format";
import { assetInputSchema, type AssetInput } from "@/lib/validation/schemas";
import type { AssetCategory, AssetWithMetrics } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { CombinedAssetsChart } from "@/features/investments/combined-assets-chart";
import type { CombinedAssetHistoryPoint } from "@/features/investments/types";

const categoryOptions: Array<{ value: AssetCategory; label: string }> = [
  { value: "aksjer", label: "Aksjer" },
  { value: "krypto", label: "Kryptovaluta" },
  { value: "fond", label: "Fond" },
  { value: "kontanter", label: "Kontanter" },
  { value: "eiendom", label: "Eiendom" },
  { value: "andre", label: "Andre investeringer" },
];

export function InvestmentWorkspace({
  initialAssets,
  combinedHistory,
  marketStatus,
  refreshing,
  onRefresh,
}: {
  initialAssets: AssetWithMetrics[];
  combinedHistory: CombinedAssetHistoryPoint[];
  marketStatus: string;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const [localAssets, setLocalAssets] = useState<AssetWithMetrics[]>([]);
  const [message, setMessage] = useState("");
  const assets = useMemo(() => [...localAssets, ...initialAssets], [initialAssets, localAssets]);

  const totals = useMemo(
    () => ({
      value: assets.reduce((sum, asset) => sum + asset.value, 0),
      gainLoss: assets.reduce((sum, asset) => sum + asset.gainLoss, 0),
    }),
    [assets],
  );

  function handleSubmit(formData: FormData) {
    const parsed = assetInputSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "Kontroller feltene");
      return;
    }
    const asset = toMetrics(parsed.data);
    setLocalAssets((current) => [asset, ...current]);
    setMessage("Beholdningen ble lagt til i lokal mock-tilstand.");
  }

  return (
    <div className="grid gap-6">
      <CombinedAssetsChart data={combinedHistory} status={marketStatus} refreshing={refreshing} onRefresh={onRefresh} />
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="min-w-0 max-w-full overflow-hidden">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Beholdninger</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Total verdi {formatCurrency(totals.value)} · gevinst/tap {formatCurrency(totals.gainLoss)}
              </p>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">ICP og BMNR oppdateres automatisk.</p>
          </div>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="text-zinc-500 dark:text-zinc-400">
                <tr className="border-b border-black/10 dark:border-white/10">
                  <th className="py-3 font-medium">Navn</th>
                  <th className="py-3 font-medium">Kategori</th>
                  <th className="py-3 text-right font-medium">Antall</th>
                  <th className="py-3 text-right font-medium">Kjøpspris</th>
                  <th className="py-3 text-right font-medium">Nåværende pris</th>
                  <th className="py-3 text-right font-medium">Verdi</th>
                  <th className="py-3 text-right font-medium">Gevinst/tap</th>
                  <th className="py-3 text-right font-medium">Avkastning</th>
                  <th className="py-3 text-right font-medium">Oppdatert</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id} className="border-b border-black/5 dark:border-white/5">
                    <td className="py-3">
                      <p className="font-medium">{asset.name}</p>
                      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                        <span>{asset.symbol}</span>
                        {asset.id.endsWith("-live") ? (
                          <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-300">
                            Live
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3">{categoryOptions.find((option) => option.value === asset.category)?.label}</td>
                    <td className="py-3 text-right">{formatNumber(asset.quantity)}</td>
                    <td className="py-3 text-right">{formatCurrency(asset.purchasePrice, asset.currency)}</td>
                    <td className="py-3 text-right">{formatCurrency(asset.currentPrice, asset.currency)}</td>
                    <td className="py-3 text-right">{formatCurrency(asset.value, asset.currency)}</td>
                    <td
                      className={
                        asset.gainLoss >= 0 ? "py-3 text-right text-emerald-600" : "py-3 text-right text-rose-600"
                      }
                    >
                      {formatCurrency(asset.gainLoss, asset.currency)}
                    </td>
                    <td className="py-3 text-right">{formatPercent(asset.returnPct)}</td>
                    <td className="py-3 text-right">{formatDate(asset.lastUpdated)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold">Registrer beholdning</h2>
          <form action={handleSubmit} className="mt-4 grid gap-3">
            <Input name="name" label="Navn" placeholder="Microsoft" />
            <Input name="symbol" label="Symbol" placeholder="MSFT" />
            <label className="grid gap-1 text-sm">
              Kategori
              <select
                name="category"
                className="rounded-md border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3 [&>*]:min-w-0">
              <Input name="quantity" label="Antall" type="number" step="any" defaultValue="1" />
              <Input name="currency" label="Valuta" defaultValue="NOK" />
            </div>
            <div className="grid grid-cols-2 gap-3 [&>*]:min-w-0">
              <Input name="purchasePrice" label="Kjøpspris" type="number" step="any" />
              <Input name="currentPrice" label="Nåværende pris" type="number" step="any" />
            </div>
            <Input name="lastUpdated" label="Sist oppdatert" type="date" defaultValue="2026-07-20" />
            <button className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-950">
              <Plus size={16} />
              Legg til
            </button>
            {message ? <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p> : null}
          </form>
        </Card>
      </div>
    </div>
  );
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="grid min-w-0 gap-1 text-sm">
      {label}
      <input
        className="min-w-0 rounded-md border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
        {...props}
      />
    </label>
  );
}

function toMetrics(input: AssetInput): AssetWithMetrics {
  const value = input.quantity * input.currentPrice;
  const costBasis = input.quantity * input.purchasePrice;
  const gainLoss = value - costBasis;
  return {
    id: `local-${Date.now()}`,
    ...input,
    value,
    costBasis,
    gainLoss,
    returnPct: costBasis === 0 ? 0 : (gainLoss / costBasis) * 100,
  };
}
