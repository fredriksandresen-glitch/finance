import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { AllocationPieChart, NetWorthAreaChart } from "@/components/charts/finance-charts";
import { Card, StatCard } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { portfolioService } from "@/lib/services/portfolio-service";

export default async function DashboardPage() {
  const portfolio = await portfolioService.getPortfolio();
  const totals = portfolioService.getTotals(portfolio);
  const allocation = portfolioService.getAllocation(portfolio);
  const holdings = portfolioService.getLargestHoldings(portfolio);
  const recent = portfolioService.getRecentActivity(portfolio);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Samlet oversikt over nettoformue, kontanter, investeringer, gjeld og månedlig kontantstrøm."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total nettoformue" value={formatCurrency(totals.netWorth)} detail="Alle verdier i NOK" />
        <StatCard
          label="Endring siste måned"
          value={formatCurrency(totals.monthlyChange)}
          tone={totals.monthlyChange >= 0 ? "positive" : "negative"}
          detail={totals.monthlyChange >= 0 ? "Opp fra forrige snapshot" : "Ned fra forrige snapshot"}
        />
        <StatCard
          label="Endring hittil i år"
          value={formatCurrency(totals.ytdChange)}
          tone={totals.ytdChange >= 0 ? "positive" : "negative"}
          detail="Basert på januar-snapshot"
        />
        <StatCard label="Totale eiendeler" value={formatCurrency(totals.totalAssets)} detail={`Gjeld ${formatCurrency(totals.totalLiabilities)}`} />
        <StatCard label="Månedlig inntekt" value={formatCurrency(totals.monthlyIncome)} tone="positive" />
        <StatCard label="Månedlige utgifter" value={formatCurrency(totals.monthlyExpenses)} tone="negative" />
        <StatCard label="Total gjeld" value={formatCurrency(totals.totalLiabilities)} />
        <StatCard label="Sparingsgrad" value={formatPercent(((totals.monthlyIncome - totals.monthlyExpenses) / totals.monthlyIncome) * 100)} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <h2 className="text-xl font-semibold">Nettoformue over tid</h2>
          <NetWorthAreaChart data={portfolio.netWorthSnapshots} />
        </Card>
        <Card>
          <h2 className="text-xl font-semibold">Fordeling mellom aktivaklasser</h2>
          <AllocationPieChart data={allocation} />
        </Card>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-xl font-semibold">Største beholdninger</h2>
          <div className="space-y-4">
            {holdings.map((asset) => (
              <div key={asset.id} className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{asset.name}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{asset.symbol}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(asset.value)}</p>
                  <p className={asset.returnPct >= 0 ? "text-sm text-emerald-600" : "text-sm text-rose-600"}>
                    {asset.returnPct >= 0 ? <ArrowUpRight className="inline" size={14} /> : <ArrowDownRight className="inline" size={14} />}
                    {formatPercent(asset.returnPct)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 text-xl font-semibold">Nylige registreringer</h2>
          <div className="space-y-4">
            {recent.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{formatDate(item.date)}</p>
                </div>
                <p className={item.amount >= 0 ? "font-medium text-emerald-600" : "font-medium text-rose-600"}>{formatCurrency(item.amount)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
