"use client";
import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable, { Column } from "@/components/DataTable";
import { money } from "@/lib/format";

type Budget = { id: number; ledger: string; grp: string; period: string; amount: number; actual: number };

export default function BudgetsPage() {
  const [rows, setRows] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const load = useCallback(() => {
    setLoading(true); setErr("");
    fetch("/api/budgets").then((r) => r.json()).then(setRows).catch((e) => setErr(String(e))).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const columns: Column<Budget>[] = [
    { key: "ledger", header: "Ledger", sortable: true, render: (b) => <span className="font-medium text-slate-800 dark:text-slate-200">{b.ledger}</span> },
    { key: "grp", header: "Group", sortable: true, sortValue: (b) => b.grp, render: (b) => <span className={`rounded-full px-2 py-0.5 text-xs ${b.grp === "Income" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}`}>{b.grp}</span> },
    { key: "period", header: "Period", sortable: true },
    { key: "amount", header: "Budget", right: true, sortable: true, sortValue: (b) => b.amount, render: (b) => money(b.amount) },
    { key: "actual", header: "Actual", right: true, sortable: true, sortValue: (b) => b.actual, render: (b) => money(b.actual) },
    { key: "variance", header: "Variance", right: true, sortable: true, sortValue: (b) => b.amount - b.actual, render: (b) => {
      const v = b.amount - b.actual;
      return <span className={`font-semibold ${v >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>{money(v)}</span>;
    } },
    { key: "pct", header: "Used %", right: true, render: (b) => {
      const pct = b.amount > 0 ? (b.actual / b.amount) * 100 : 0;
      return <span className={pct > 100 ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-slate-500 dark:text-slate-400"}>{pct.toFixed(0)}%</span>;
    } },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader title="Budgets" subtitle="Budget vs actual · variance per ledger"
        actions={<button onClick={load} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">↻ Refresh</button>} />
      {err && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{err} <button onClick={load} className="underline">retry</button></div>}
      <DataTable columns={columns} rows={rows} loading={loading}
        searchKeys={["ledger", "period", "grp"]} searchPlaceholder="Search ledger, period…" />
    </main>
  );
}
