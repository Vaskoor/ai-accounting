"use client";
import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable, { Column } from "@/components/DataTable";
import { money } from "@/lib/format";

type Party = { id: number; name: string; type: string; gstin: string | null; phone: string | null; email: string | null; credit_days: number; credit_limit: number };

export default function PartiesPage() {
  const [rows, setRows] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("All");
  const load = useCallback(() => {
    setLoading(true); setErr("");
    fetch("/api/parties").then((r) => r.json()).then(setRows).catch((e) => setErr(String(e))).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = filter === "All" ? rows : rows.filter((p) => p.type === filter);
  const columns: Column<Party>[] = [
    { key: "name", header: "Name", sortable: true, render: (p) => <span className="font-medium text-slate-800 dark:text-slate-200">{p.name}</span> },
    { key: "type", header: "Type", sortable: true, render: (p) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.type === "Customer" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}`}>{p.type}</span> },
    { key: "gstin", header: "PAN / VAT No", render: (p) => p.gstin ? <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{p.gstin}</span> : "—" },
    { key: "phone", header: "Phone", render: (p) => <span className="text-slate-500 dark:text-slate-400">{p.phone || "—"}</span> },
    { key: "credit_days", header: "Credit Days", right: true, sortable: true, sortValue: (p) => p.credit_days, render: (p) => <span>{p.credit_days}</span> },
    { key: "credit_limit", header: "Credit Limit", right: true, sortable: true, sortValue: (p) => p.credit_limit, render: (p) => <span className="font-semibold">{money(p.credit_limit)}</span> },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader title="Parties" subtitle="Customers and suppliers"
        actions={<button onClick={load} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">↻ Refresh</button>} />
      {err && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{err} <button onClick={load} className="underline">retry</button></div>}
      <div className="mb-3 flex gap-1">
        {["All", "Customer", "Supplier"].map((t) => (
          <button key={t} onClick={() => setFilter(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${filter === t ? "bg-emerald-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"}`}>{t}</button>
        ))}
      </div>
      <DataTable columns={columns} rows={filtered} loading={loading}
        searchKeys={["name", "gstin", "phone", "email"]} searchPlaceholder="Search party, PAN, phone…" />
    </main>
  );
}
