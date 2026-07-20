"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";

const palette = ["#14b8a6", "#2563eb", "#f59e0b", "#8b5cf6", "#ef4444", "#64748b"];

export function NetWorthAreaChart({
  data,
}: {
  data: Array<{ date: string; netWorth: number; assets?: number; liabilities?: number }>;
}) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
          <defs>
            <linearGradient id="netWorth" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
          <XAxis dataKey="date" tickFormatter={(value) => value.slice(5)} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000000)}m`} tickLine={false} axisLine={false} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} labelFormatter={(label) => `Dato: ${label}`} />
          <Area type="monotone" dataKey="netWorth" name="Nettoformue" stroke="#14b8a6" fill="url(#netWorth)" strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AllocationPieChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={3}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={palette[index % palette.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
            <span className="size-2 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} />
            {entry.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CashflowBarChart({
  data,
}: {
  data: Array<{ category: string; income: number; expense: number }>;
}) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
          <XAxis dataKey="category" tickLine={false} axisLine={false} />
          <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} tickLine={false} axisLine={false} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Bar dataKey="income" name="Inntekt" fill="#14b8a6" radius={[6, 6, 0, 0]} />
          <Bar dataKey="expense" name="Utgift" fill="#ef4444" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
