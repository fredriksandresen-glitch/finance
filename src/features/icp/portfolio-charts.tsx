"use client";

import { useMemo } from "react";
import { Activity, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  calculateHistoricalValueSeries,
  calculateRewardForPeriod,
  decimal,
  formatFiat,
  formatIcp,
} from "@/features/icp/calculations";
import type { IcpHoldingEvent, IcpPortfolio, IcpPriceHistoryPoint } from "@/features/icp/types";

function formatDate(value: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("nb-NO", { ...options, timeZone: "UTC" }).format(new Date(value));
}

function formatCompactNok(value: number) {
  return new Intl.NumberFormat("nb-NO", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

const tooltipStyle = {
  backgroundColor: "#111318",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 6,
  color: "#f4f4f5",
  fontSize: 12,
};

export function PortfolioCharts({
  portfolio,
  livePriceNok,
  priceHistory,
  holdingEvents,
  historyError,
  historyEndDate,
}: {
  portfolio: IcpPortfolio;
  livePriceNok: string;
  priceHistory: IcpPriceHistoryPoint[];
  holdingEvents: IcpHoldingEvent[];
  historyError: string;
  historyEndDate: string;
}) {
  const priceData = useMemo(
    () =>
      priceHistory.map((point) => ({
        date: point.timestamp,
        nok: decimal(point.nok).toNumber(),
      })),
    [priceHistory],
  );
  const valueData = useMemo(
    () =>
      historyEndDate && livePriceNok
        ? calculateHistoricalValueSeries(portfolio, priceHistory, holdingEvents, livePriceNok, historyEndDate).map(
            (point) => ({
              ...point,
              priceNok: decimal(point.priceNok).toNumber(),
              maturityIcp: decimal(point.maturityIcp).toNumber(),
              totalIcp: decimal(point.totalIcp).toNumber(),
              totalValueNok: decimal(point.totalValueNok).toNumber(),
              manualChangeIcp: decimal(point.manualChangeIcp).toNumber(),
            }),
          )
        : [],
    [historyEndDate, holdingEvents, livePriceNok, portfolio, priceHistory],
  );
  const dailyMaturity = calculateRewardForPeriod(portfolio, "day");
  const firstValue = valueData[0];
  const latestValue = valueData.at(-1);
  const maturityAdded =
    firstValue && latestValue ? decimal(latestValue.maturityIcp).minus(firstValue.maturityIcp) : decimal(0);

  return (
    <section className="grid gap-4 xl:grid-cols-2" aria-label="ICP-grafer">
      <article className="min-w-0 rounded-lg border border-white/10 bg-white/[0.035] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-cyan-400/10 p-2 text-cyan-300">
              <Activity size={19} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">ICP-pris</h2>
              <p className="mt-1 text-sm text-zinc-500">Siste 90 dager i norske kroner</p>
            </div>
          </div>
          <span className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-zinc-400">NOK</span>
        </div>

        {priceData.length > 1 ? (
          <div className="mt-6 h-72 min-w-0" data-testid="icp-price-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value: string) => formatDate(value, { day: "2-digit", month: "short" })}
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={40}
                />
                <YAxis
                  tickFormatter={(value: number) => `${formatCompactNok(value)} kr`}
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(value) => formatDate(String(value), { dateStyle: "medium" })}
                  formatter={(value) => [formatFiat(String(value ?? 0), "NOK", 2), "ICP-pris"]}
                />
                <Area
                  type="monotone"
                  dataKey="nok"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  fill="#22d3ee"
                  fillOpacity={0.1}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-6 flex h-72 items-center justify-center rounded-md border border-dashed border-white/10 px-6 text-center text-sm text-zinc-500">
            {historyError || "Henter prishistorikk fra CoinGecko ..."}
          </div>
        )}
      </article>

      <article className="min-w-0 rounded-lg border border-white/10 bg-white/[0.035] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-emerald-400/10 p-2 text-emerald-300">
              <TrendingUp size={19} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Total ICP-verdi</h2>
              <p className="mt-1 text-sm text-zinc-500">Historisk dagsverdi · siste 90 dager</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-zinc-400">1 punkt / dag</span>
            <span className="rounded-md border border-emerald-400/20 bg-emerald-400/[0.06] px-2.5 py-1 text-xs text-emerald-300">
              +{formatIcp(dailyMaturity, 4, 4)} maturity
            </span>
          </div>
        </div>

        {valueData.length > 1 ? (
          <div className="mt-6 h-72 min-w-0" data-testid="icp-value-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={valueData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value: string) => formatDate(value, { month: "short" })}
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={48}
                />
                <YAxis
                  tickFormatter={(value: number) => `${formatCompactNok(value)} kr`}
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={68}
                  domain={["dataMin", "auto"]}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(value) => formatDate(String(value), { dateStyle: "medium" })}
                  formatter={(value, name) =>
                    name === "Totalverdi"
                      ? [formatFiat(String(value ?? 0), "NOK"), name]
                      : [formatIcp(String(value ?? 0)), name]
                  }
                />
                <Area
                  type="monotone"
                  dataKey="totalValueNok"
                  name="Totalverdi"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="#34d399"
                  fillOpacity={0.1}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-6 flex h-72 items-center justify-center text-sm text-zinc-500">Venter på NOK-pris ...</div>
        )}

        <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs uppercase text-zinc-500">ICP i dag</p>
            <p className="mt-1 font-semibold text-cyan-300">
              {latestValue ? formatIcp(String(latestValue.totalIcp)) : "–"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-zinc-500">Pris i dag</p>
            <p className="mt-1 font-semibold text-zinc-200">
              {latestValue ? formatFiat(String(latestValue.priceNok), "NOK") : "–"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-zinc-500">Totalverdi i dag</p>
            <p className="mt-1 font-semibold text-emerald-300">
              {latestValue ? formatFiat(String(latestValue.totalValueNok), "NOK") : "–"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-zinc-500">Maturity lagt til</p>
            <p className="mt-1 font-semibold text-amber-300">{latestValue ? `+${formatIcp(maturityAdded)}` : "–"}</p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-zinc-500">
          Hvert punkt er totalt antall ICP den dagen × faktisk ICP-pris i NOK den dagen. Maturity legges til daglig, og
          manuelle saldoøkninger registreres som kjøp fra datoen du lagrer dem.
        </p>
      </article>
    </section>
  );
}
