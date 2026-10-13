"use client";
import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable, { Column } from "@/components/DataTable";
import { money } from "@/lib/format";

type Ledger = { id: number; name: string; group_name: string; sub_group: string | null; opening_balance: number };

const groupTone: Record<string, string> = {
  Assets: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  Liabilities: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  Equity: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  Income: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  Expenses: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
};

export default function LedgersPage() {
  const [rows, setRows] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const load = useCallback(() => {
    setLoading(true); setErr("");
    fetch("/api/ledgers").then((r) => r.json()).then(setRows).catch((e) => setErr(String(e))).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const columns: Column<Ledger>[] = [
    { key: "name", header: "Ledger Name", sortable: true, render: (l) => <span className="font-medium text-slate-800 dark:text-slate-200">{l.name}</span> },
    { key: "group_name", header: "Group", sortable: true, sortValue: (l) => l.group_name, render: (l) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${groupTone[l.group_name] || "bg-slate-100 dark:bg-slate-800"}`}>{l.group_name}</span> },
    { key: "sub_group", header: "Sub-group", render: (l) => <span className="text-slate-500 dark:text-slate-400">{l.sub_group || "—"}</span> },
    { key: "opening_balance", header: "Opening Balance", right: true, sortable: true, sortValue: (l) => l.opening_balance, render: (l) => <span className="font-semibold">{money(l.opening_balance)}</span> },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader title="Chart of Accounts" subtitle="All ledgers grouped by Assets / Liabilities / Equity / Income / Expenses"
        actions={<button onClick={load} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">↻ Refresh</button>} />
      {err && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{err} <button onClick={load} className="underline">retry</button></div>}
      <DataTable columns={columns} rows={rows} loading={loading}
        searchKeys={["name", "group_name", "sub_group"]} searchPlaceholder="Search ledger, group…" />
    </main>
  );
}
