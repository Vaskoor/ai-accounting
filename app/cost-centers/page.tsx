"use client";
import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable, { Column } from "@/components/DataTable";

type CC = { id: number; name: string; parent_id: number | null; created_at: string };

export default function CostCentersPage() {
  const [rows, setRows] = useState<CC[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const load = useCallback(() => {
    setLoading(true); setErr("");
    fetch("/api/cost-centers").then((r) => r.json()).then(setRows).catch((e) => setErr(String(e))).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const columns: Column<CC>[] = [
    { key: "name", header: "Cost Center", sortable: true, render: (c) => <span className="font-medium text-slate-800 dark:text-slate-200">{c.name}</span> },
    { key: "parent_id", header: "Parent", render: (c) => {
      if (!c.parent_id) return <span className="text-slate-400">— root —</span>;
      const p = rows.find((r) => r.id === c.parent_id);
      return <span className="text-slate-500 dark:text-slate-400">{p?.name || "#" + c.parent_id}</span>;
    } },
    { key: "created_at", header: "Created", sortable: true, sortValue: (c) => c.created_at, render: (c) => <span className="text-slate-400">{c.created_at?.slice(0, 10)}</span> },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader title="Cost Centers" subtitle="Project / department cost allocation"
        actions={<button onClick={load} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">↻ Refresh</button>} />
      {err && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{err} <button onClick={load} className="underline">retry</button></div>}
      <DataTable columns={columns} rows={rows} loading={loading} searchKeys={["name"]} searchPlaceholder="Search cost center…" />
    </main>
  );
}
