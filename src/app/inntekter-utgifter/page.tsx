"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { CashflowWorkspace } from "@/features/cashflow/cashflow-workspace";
import { portfolioService } from "@/lib/services/portfolio-service";
import type { IncomeExpenseEntry } from "@/lib/types";

export default function IncomeExpensesPage() {
  const [entries, setEntries] = useState<IncomeExpenseEntry[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      const p = await portfolioService.getPortfolio();
      if (!active) return;
      setEntries(p.incomeExpenseEntries);
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <PageHeader
        title="Inntekter og utgifter"
        description="Manuell registrering av faste, variable, gjentakende og enkeltstående poster med månedlig oversikt."
      />
      <CashflowWorkspace initialEntries={entries} />
    </>
  );
}
