"use client";

import { RefreshCw } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import type { CombinedAssetHistoryPoint } from "@/features/investments/types";
import { formatCurrency, formatDate } from "@/lib/format";

export function CombinedAssetsChart({
  data,
  status,
  refreshing,
  onRefresh,
}: {
  data: CombinedAssetHistoryPoint[];
  status: string;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const latest = data.at(-1);

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">ICP + BMNR</h2>
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

      {data.length > 1 ? (
        <div className="mt-6 h-80 min-w-0" data-testid="combined-assets-chart">
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
              <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} />
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

      <div className="mt-5 grid gap-3 border-t border-black/10 pt-4 sm:grid-cols-3 dark:border-white/10">
        <Metric label="ICP-verdi" value={latest ? formatCurrency(latest.icpValueNok) : "–"} />
        <Metric label="BMNR-verdi" value={latest ? formatCurrency(latest.bmnrValueNok) : "–"} />
        <Metric label="Samlet verdi" value={latest ? formatCurrency(latest.totalValueNok) : "–"} emphasize />
      </div>
      <p className="mt-4 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{status}</p>
    </Card>
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
