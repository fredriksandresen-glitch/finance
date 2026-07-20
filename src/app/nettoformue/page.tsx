import { NetWorthAreaChart } from "@/components/charts/finance-charts";
import { Card, StatCard } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { formatCurrency } from "@/lib/format";
import { portfolioService } from "@/lib/services/portfolio-service";

export default async function NetWorthPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: "1m" | "6m" | "1y" | "all" }>;
}) {
  const params = await searchParams;
  const range = params.range ?? "1y";
  const portfolio = await portfolioService.getPortfolio();
  const totals = portfolioService.getTotals(portfolio);
  const data = portfolioService.getNetWorthRange(portfolio.netWorthSnapshots, range);

  return (
    <>
      <PageHeader
        title="Nettoformue"
        description="Historisk utvikling for eiendeler, gjeld, total nettoformue og månedlig endring."
      />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total nettoformue" value={formatCurrency(totals.netWorth)} />
        <StatCard label="Eiendeler" value={formatCurrency(totals.totalAssets)} />
        <StatCard label="Gjeld" value={formatCurrency(totals.totalLiabilities)} />
        <StatCard label="Månedlig endring" value={formatCurrency(totals.monthlyChange)} tone={totals.monthlyChange >= 0 ? "positive" : "negative"} />
      </div>
      <Card className="mt-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">Utvikling</h2>
          <div className="flex flex-wrap gap-2">
            {[
              ["1m", "1 måned"],
              ["6m", "6 måneder"],
              ["1y", "1 år"],
              ["all", "Hele perioden"],
            ].map(([value, label]) => (
              <a
                key={value}
                href={`/nettoformue?range=${value}`}
                className={
                  range === value
                    ? "rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-950"
                    : "rounded-md border border-black/10 px-3 py-2 text-sm font-medium dark:border-white/10"
                }
              >
                {label}
              </a>
            ))}
          </div>
        </div>
        <NetWorthAreaChart data={data} />
      </Card>
      <Card className="mt-6">
        <h2 className="mb-4 text-xl font-semibold">Snapshots</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-zinc-500 dark:text-zinc-400">
              <tr className="border-b border-black/10 dark:border-white/10">
                <th className="py-3 font-medium">Dato</th>
                <th className="py-3 text-right font-medium">Eiendeler</th>
                <th className="py-3 text-right font-medium">Gjeld</th>
                <th className="py-3 text-right font-medium">Nettoformue</th>
                <th className="py-3 text-right font-medium">Månedlig endring</th>
              </tr>
            </thead>
            <tbody>
              {data.map((snapshot, index) => {
                const previous = data[index - 1]?.netWorth ?? snapshot.netWorth;
                return (
                  <tr key={snapshot.id} className="border-b border-black/5 dark:border-white/5">
                    <td className="py-3">{snapshot.date}</td>
                    <td className="py-3 text-right">{formatCurrency(snapshot.assets)}</td>
                    <td className="py-3 text-right">{formatCurrency(snapshot.liabilities)}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(snapshot.netWorth)}</td>
                    <td className="py-3 text-right">{formatCurrency(snapshot.netWorth - previous)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
