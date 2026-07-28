"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Coins, Download, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ICP_CANISTER_ID } from "@/lib/icp/config";
import { portfolioService } from "@/lib/services/portfolio-service";
import type { Portfolio } from "@/lib/types";

export default function SettingsPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const p = await portfolioService.getPortfolio();
      if (!active) return;
      setPortfolio(p);
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  if (!portfolio) {
    return (
      <div className="flex h-64 items-center justify-center text-zinc-500">
        Laster innstillinger...
      </div>
    );
  }

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
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Standardvaluta</p>
                <p className="text-sm text-zinc-500">{portfolio.settings.defaultCurrency}</p>
              </div>
              <span className="rounded-md border border-black/10 px-2 py-1 text-xs dark:border-white/10">Kommer senere</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Tema</p>
                <p className="text-sm text-zinc-500">{portfolio.settings.theme}</p>
              </div>
              <span className="rounded-md border border-black/10 px-2 py-1 text-xs dark:border-white/10">Kommer senere</span>
            </div>
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold">Dataflyt</h2>
          <div className="mt-4 grid gap-3">
            <button disabled className="flex items-center gap-2 rounded-md border border-black/10 px-3 py-2 text-sm opacity-50 dark:border-white/10">
              <Download size={16} />
              Importer data
            </button>
            <button disabled className="flex items-center gap-2 rounded-md border border-black/10 px-3 py-2 text-sm opacity-50 dark:border-white/10">
              <Upload size={16} />
              Eksporter data
            </button>
          </div>
        </Card>
        <Card>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Coins size={20} />
            Internet Computer
          </h2>
          <div className="mt-4 grid gap-4">
            <div>
              <p className="font-medium">Canister-ID</p>
              <p className="mt-1 font-mono text-sm text-zinc-500">{ICP_CANISTER_ID}</p>
            </div>
            <div>
              <p className="font-medium">Internet Identity</p>
              <p className="text-sm text-zinc-500">
                {portfolio.settings.internetIdentityEnabled ? "Aktivert" : "Deaktivert"}
              </p>
            </div>
            <Link
              href="/icp"
              className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
            >
              Gå til ICP-dashboard
              <ArrowRight size={16} />
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}
