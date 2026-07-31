"use client";

import { RefreshCw } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import type { CombinedAssetHistoryPoint } from "@/features/investments/types";
import { formatCurrency, formatDate } from "@/lib/format";

export function CombinedAssetsChart({
  data,
  status,
  freshness,
  refreshing,
  onRefresh,
}: {
  data: CombinedAssetHistoryPoint[];
  status: string;
  freshness: "loading" | "live" | "mixed" | "stale";
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const latest = data.at(-1);

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">ICP + aksjer</h2>
            <FreshnessBadge freshness={freshness} />
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Kombinert markedsverdi i NOK · siste 90 dager</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          title="Oppdater livepriser"
          className="inline-flex size-9 items-center justify-center rounded-md border border-black/10 text-zinc-600 hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          <span className="sr-only">Oppdater livepriser</span>
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
        <SeriesLabel color="#22c55e" label="Samlet" />
        <SeriesLabel color="#06b6d4" label="ICP" />
        <SeriesLabel color="#f59e0b" label="BMNR" />
        <SeriesLabel color="#8b5cf6" label="SBET" />
        <SeriesLabel color="#f43f5e" label="MSTR" />
      </div>

      {data.length > 1 ? (
        <div className="mt-3 h-80 min-w-0" data-testid="combined-assets-chart">
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="combinedTotal" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(value: string) =>
                  new Intl.DateTimeFormat("nb-NO", { day: "2-digit", month: "short" }).format(
                    new Date(`${value}T12:00:00Z`),
                  )
                }
                minTickGap={36}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                width={56}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value, name) => [formatCurrency(Number(value)), String(name)]}
                labelFormatter={(label) => formatDate(String(label))}
              />
              <Area
                type="monotone"
                dataKey="totalValueNok"
                name="Samlet"
                stroke="#22c55e"
                fill="url(#combinedTotal)"
                strokeWidth={3}
              />
              <Area
                type="monotone"
                dataKey="icpValueNok"
                name="ICP"
                stroke="#06b6d4"
                fill="transparent"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="sbetValueNok"
                name="SBET"
                stroke="#8b5cf6"
                fill="transparent"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="mstrValueNok"
                name="MSTR"
                stroke="#f43f5e"
                fill="transparent"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="bmnrValueNok"
                name="BMNR"
                stroke="#f59e0b"
                fill="transparent"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-6 flex h-80 items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
          {status}
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-black/10 pt-4 lg:grid-cols-5 dark:border-white/10">
        <Metric label="ICP-verdi" value={latest ? formatCurrency(latest.icpValueNok) : "–"} />
        <Metric label="BMNR-verdi" value={latest ? formatCurrency(latest.bmnrValueNok) : "–"} />
        <Metric label="SBET-verdi" value={latest ? formatCurrency(latest.sbetValueNok) : "–"} />
        <Metric label="MSTR-verdi" value={latest ? formatCurrency(latest.mstrValueNok) : "–"} />
        <Metric label="Samlet verdi" value={latest ? formatCurrency(latest.totalValueNok) : "–"} emphasize />
      </div>
      <p className="mt-4 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{status}</p>
    </Card>
  );
}

function FreshnessBadge({ freshness }: { freshness: "loading" | "live" | "mixed" | "stale" }) {
  const styles = {
    loading: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
    live: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    mixed: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    stale: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
  };
  const labels = { loading: "Oppdaterer", live: "Live", mixed: "Delvis lagret", stale: "Ikke live" };
  return (
    <span className={`rounded px-2 py-1 text-[10px] font-semibold uppercase ${styles[freshness]}`}>
      {labels[freshness]}
    </span>
  );
}

function SeriesLabel({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function Metric({ label, value, emphasize = false }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`mt-1 font-semibold ${emphasize ? "text-emerald-600 dark:text-emerald-300" : ""}`}>{value}</p>
    </div>
  );
}
