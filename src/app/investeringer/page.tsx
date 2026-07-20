import { PageHeader } from "@/components/ui/page-header";
import { InvestmentWorkspace } from "@/features/investments/investment-workspace";
import { portfolioService } from "@/lib/services/portfolio-service";

export default async function InvestmentsPage() {
  const portfolio = await portfolioService.getPortfolio();
  const assets = portfolioService.getAssetMetrics(portfolio);

  return (
    <>
      <PageHeader
        title="Investeringer"
        description="Registrer aksjer, kryptovaluta, fond, kontanter, eiendom og andre investeringer med manuelle priser."
      />
      <InvestmentWorkspace initialAssets={assets} />
    </>
  );
}
