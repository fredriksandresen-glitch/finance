"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { InvestmentWorkspace } from "@/features/investments/investment-workspace";
import { portfolioService } from "@/lib/services/portfolio-service";
import type { AssetWithMetrics } from "@/lib/types";

export default function InvestmentsPage() {
  const [assets, setAssets] = useState<AssetWithMetrics[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      const p = await portfolioService.getPortfolio();
      if (!active) return;
      setAssets(portfolioService.getAssetMetrics(p));
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

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
