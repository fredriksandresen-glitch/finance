import { PageHeader } from "@/components/ui/page-header";
import { CashflowWorkspace } from "@/features/cashflow/cashflow-workspace";
import { portfolioService } from "@/lib/services/portfolio-service";

export default async function IncomeExpensesPage() {
  const portfolio = await portfolioService.getPortfolio();

  return (
    <>
      <PageHeader
        title="Inntekter og utgifter"
        description="Manuell registrering av faste, variable, gjentakende og enkeltstående poster med månedlig oversikt."
      />
      <CashflowWorkspace initialEntries={portfolio.incomeExpenseEntries} />
    </>
  );
}
