import Link from "next/link";
import { ArrowRight, Coins, Download, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ICP_CANISTER_ID } from "@/lib/icp/config";
import { portfolioService } from "@/lib/services/portfolio-service";

export default async function SettingsPage() {
  const portfolio = await portfolioService.getPortfolio();

  return (
    <>
      <PageHeader
        title="Innstillinger"
        description="Konfigurasjon for valuta, tema, dataflyt og fremtidig Internet Computer-integrasjon."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-semibold">Preferanser</h2>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-1 text-sm">
              Standardvaluta
              <select
                defaultValue={portfolio.settings.defaultCurrency}
                className="rounded-md border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
              >
                <option>NOK</option>
                <option>USD</option>
                <option>EUR</option>
                <option>SEK</option>
                <option>DKK</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Tema
              <select
                defaultValue={portfolio.settings.theme}
                className="rounded-md border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
              >
                <option value="system">Følg system</option>
                <option value="light">Lys modus</option>
                <option value="dark">Mørk modus</option>
              </select>
            </label>
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold">Data</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-md border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/10">
              <Download size={16} />
              Eksporter JSON
            </button>
            <button className="inline-flex items-center gap-2 rounded-md border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/10">
              <Download size={16} />
              Eksporter CSV
            </button>
            <button className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-950">
              <Upload size={16} />
              Importer data
            </button>
          </div>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            Knappene er plassert for MVP-flyt. Filbehandling kobles til persistent lagring i neste iterasjon.
          </p>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold">Internet Identity</h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-300">
            Tilkobling til Internet Identity er planlagt, men ikke aktivert. Ingen controller-identiteter, seed phrases
            eller private nøkler skal inn i repoet eller Vercel.
          </p>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold">ICP-canister</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Miljøvariabel</dt>
              <dd className="font-mono">NEXT_PUBLIC_ICP_CANISTER_ID</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Canister-ID</dt>
              <dd className="font-mono">{ICP_CANISTER_ID}</dd>
            </div>
          </dl>
          <Link
            href="/icp"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
          >
            <Coins size={16} />
            Åpne ICP-innstillinger
            <ArrowRight size={15} />
          </Link>
        </Card>
      </div>
    </>
  );
}
