"use client";
import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable, { Column } from "@/components/DataTable";
import { money } from "@/lib/format";

type Row = { id: number; party: string; type: string; outstanding: number; bucket: string; credit_days: number; credit_limit: number };

const bucketTone: Record<string, string> = {
  "0-30": "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  "31-60": "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  "61-90": "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  "90+": "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
};

export default function AgingPage() {
  const [data, setData] = useState<{ rows: Row[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const load = useCallback(() => {
    setLoading(true); setErr("");
    fetch("/api/aging").then((r) => r.json()).then(setData).catch((e) => setErr(String(e))).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const rows = data?.rows || [];
  const total = rows.reduce((s, r) => s + r.outstanding, 0);
  const byBucket = ["0-30", "31-60", "61-90", "90+"].map((b) => ({
    bucket: b, total: rows.filter((r) => r.bucket === b).reduce((s, r) => s + r.outstanding, 0),
  }));

  const columns: Column<Row>[] = [
    { key: "party", header: "Party", sortable: true, render: (r) => <span className="font-medium text-slate-800 dark:text-slate-200">{r.party}</span> },
    { key: "type", header: "Type", sortable: true, render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs ${r.type === "Customer" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}`}>{r.type}</span> },
    { key: "bucket", header: "Aging Bucket", sortable: true, render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${bucketTone[r.bucket] || "bg-slate-100 dark:bg-slate-800"}`}>{r.bucket} days</span> },
    { key: "outstanding", header: "Outstanding", right: true, sortable: true, sortValue: (r) => r.outstanding, render: (r) => <span className="font-semibold">{money(r.outstanding)}</span> },
    { key: "credit_days", header: "Terms", right: true, render: (r) => <span className="text-slate-400">{r.credit_days}d</span> },
    { key: "credit_limit", header: "Limit", right: true, render: (r) => <span className="text-slate-500 dark:text-slate-400">{money(r.credit_limit)}</span> },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader title="Aging Analysis" subtitle="Receivables / payables by age bucket"
        actions={<button onClick={load} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">↻ Refresh</button>} />
      {err && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{err} <button onClick={load} className="underline">retry</button></div>}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {byBucket.map((b) => (
          <div key={b.bucket} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-400">{b.bucket} days</p>
            <p className="mt-1 text-lg font-bold tabular text-slate-900 dark:text-white">{money(b.total)}</p>
          </div>
        ))}
      </div>
      <DataTable columns={columns} rows={rows} loading={loading} searchKeys={["party", "type", "bucket"]} searchPlaceholder="Search party, bucket…" />
      <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">Total outstanding: <span className="font-bold text-slate-700 dark:text-slate-200">{money(total)}</span></p>
    </main>
  );
}
