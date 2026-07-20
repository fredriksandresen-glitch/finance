"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { CashflowBarChart } from "@/components/charts/finance-charts";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import { incomeExpenseInputSchema } from "@/lib/validation/schemas";
import type { IncomeExpenseEntry } from "@/lib/types";

export function CashflowWorkspace({ initialEntries }: { initialEntries: IncomeExpenseEntry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [message, setMessage] = useState("");

  const summary = useMemo(() => {
    const income = entries.filter((entry) => entry.type === "income").reduce((sum, entry) => sum + entry.amount, 0);
    const expense = entries.filter((entry) => entry.type === "expense").reduce((sum, entry) => sum + entry.amount, 0);
    const byCategory = Object.entries(
      entries.reduce<Record<string, { income: number; expense: number }>>((acc, entry) => {
        acc[entry.category] ??= { income: 0, expense: 0 };
        acc[entry.category][entry.type] += entry.amount;
        return acc;
      }, {}),
    ).map(([category, values]) => ({ category, ...values }));
    return { income, expense, byCategory };
  }, [entries]);

  function handleSubmit(formData: FormData) {
    const parsed = incomeExpenseInputSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "Kontroller feltene");
      return;
    }
    setEntries((current) => [{ id: `local-${Date.now()}`, ...parsed.data }, ...current]);
    setMessage("Registreringen ble lagt til i lokal mock-tilstand.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Inntekt denne måneden</p>
            <p className="mt-2 text-2xl font-semibold">{formatCurrency(summary.income)}</p>
          </Card>
          <Card>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Utgifter denne måneden</p>
            <p className="mt-2 text-2xl font-semibold">{formatCurrency(summary.expense)}</p>
          </Card>
          <Card>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Netto kontantstrøm</p>
            <p className="mt-2 text-2xl font-semibold">{formatCurrency(summary.income - summary.expense)}</p>
          </Card>
        </div>
        <Card>
          <h2 className="text-xl font-semibold">Fordeling per kategori</h2>
          <CashflowBarChart data={summary.byCategory} />
        </Card>
        <Card>
          <h2 className="mb-4 text-xl font-semibold">Månedlige registreringer</h2>
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {entries.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{entry.description}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {entry.category} · {formatDate(entry.date)} · {entry.cadence === "fixed" ? "Fast" : "Variabel"} ·{" "}
                    {entry.recurrence === "recurring" ? "Gjentakende" : "Enkeltstående"}
                  </p>
                </div>
                <p className={entry.type === "income" ? "font-medium text-emerald-600" : "font-medium text-rose-600"}>
                  {entry.type === "income" ? "+" : "-"}
                  {formatCurrency(entry.amount)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card>
        <h2 className="text-xl font-semibold">Ny registrering</h2>
        <form action={handleSubmit} className="mt-4 grid gap-3">
          <Input name="amount" label="Beløp" type="number" step="any" />
          <Input name="date" label="Dato" type="date" defaultValue="2026-07-20" />
          <Input name="category" label="Kategori" placeholder="Mat, lønn, bolig" />
          <Input name="description" label="Beskrivelse" placeholder="Kort forklaring" />
          <label className="grid gap-1 text-sm">
            Type
            <select name="type" className="rounded-md border border-black/10 bg-transparent px-3 py-2 dark:border-white/10">
              <option value="income">Inntekt</option>
              <option value="expense">Utgift</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Fast eller variabel
            <select name="cadence" className="rounded-md border border-black/10 bg-transparent px-3 py-2 dark:border-white/10">
              <option value="fixed">Fast</option>
              <option value="variable">Variabel</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Frekvens
            <select name="recurrence" className="rounded-md border border-black/10 bg-transparent px-3 py-2 dark:border-white/10">
              <option value="recurring">Gjentakende</option>
              <option value="one-off">Enkeltstående</option>
            </select>
          </label>
          <button className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-950">
            <Plus size={16} />
            Legg til
          </button>
          {message ? <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p> : null}
        </form>
      </Card>
    </div>
  );
}

function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <input className="rounded-md border border-black/10 bg-transparent px-3 py-2 dark:border-white/10" {...props} />
    </label>
  );
}
