"use client";
import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable, { Column } from "@/components/DataTable";

type Entry = { id: number; action: string; entity: string; entity_id: number | null; detail: string; created_at: string };

const actionTone: Record<string, string> = {
  create: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  update: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  delete: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  "ai-create": "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  "create-ledger": "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
};

export default function AuditPage() {
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const load = useCallback(() => {
    setLoading(true); setErr("");
    fetch("/api/audit").then((r) => r.json()).then(setRows).catch((e) => setErr(String(e))).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const columns: Column<Entry>[] = [
    { key: "created_at", header: "When", sortable: true, sortValue: (e) => e.created_at, render: (e) => <span className="font-mono text-xs text-slate-400">{e.created_at?.replace("T", " ").slice(0, 19)}</span> },
    { key: "action", header: "Action", sortable: true, render: (e) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${actionTone[e.action] || "bg-slate-100 dark:bg-slate-800"}`}>{e.action}</span> },
    { key: "entity", header: "Entity", sortable: true, render: (e) => <span className="text-slate-700 dark:text-slate-200">{e.entity}</span> },
    { key: "detail", header: "Detail", render: (e) => <span className="text-slate-500 dark:text-slate-400">{e.detail}</span> },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader title="Audit Log" subtitle="Every create / update / delete + AI actions"
        actions={<button onClick={load} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">↻ Refresh</button>} />
      {err && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{err} <button onClick={load} className="underline">retry</button></div>}
      <DataTable columns={columns} rows={rows} loading={loading} searchKeys={["action", "entity", "detail"]} searchPlaceholder="Search action, entity, detail…" pageSize={20} />
    </main>
  );
}
