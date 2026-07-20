import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn("rounded-lg border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950", className)}
      {...props}
    />
  );
}

export function StatCard({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  return (
    <Card className="min-h-32">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{value}</p>
      {detail ? (
        <p
          className={cn(
            "mt-3 text-sm",
            tone === "positive" && "text-emerald-600 dark:text-emerald-400",
            tone === "negative" && "text-rose-600 dark:text-rose-400",
            tone === "neutral" && "text-zinc-500 dark:text-zinc-400",
          )}
        >
          {detail}
        </p>
      ) : null}
    </Card>
  );
}
