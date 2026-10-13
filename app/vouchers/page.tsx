"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import DataTable, { Column } from "@/components/DataTable";
import { money } from "@/lib/format";

type Voucher = { id: number; voucher_no: string; voucher_type: string; date: string; narration: string; reference: string; entries: { amount: number; entry_type: string; ledger?: string }[] };

const typeTone: Record<string, string> = {
  Sales: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  Purchase: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  Receipt: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  Payment: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  Journal: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
};

export default function VouchersPage() {
  const [rows, setRows] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const load = useCallback(() => {
    setLoading(true); setErr("");
    fetch("/api/vouchers").then((r) => r.json()).then(setRows).catch((e) => setErr(String(e))).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const columns: Column<Voucher>[] = [
    { key: "voucher_no", header: "Voucher No", sortable: true, render: (v) => <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{v.voucher_no}</span> },
    { key: "voucher_type", header: "Type", sortable: true, render: (v) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeTone[v.voucher_type] || "bg-slate-100 dark:bg-slate-800"}`}>{v.voucher_type}</span> },
    { key: "date", header: "Date", sortable: true, sortValue: (v) => v.date },
    { key: "narration", header: "Narration", render: (v) => <span className="text-slate-600 dark:text-slate-300">{v.narration}</span> },
    { key: "reference", header: "Reference", render: (v) => v.reference ? <span className="font-mono text-xs text-slate-400">{v.reference}</span> : "—" },
    { key: "amount", header: "Amount", right: true, sortable: true, sortValue: (v) => v.entries.filter((e) => e.entry_type === "Dr").reduce((s, e) => s + e.amount, 0), render: (v) => {
      const dr = v.entries.filter((e) => e.entry_type === "Dr").reduce((s, e) => s + e.amount, 0);
      return <span className="font-semibold">{money(dr)}</span>;
    } },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader title="Vouchers" subtitle="All double-entry vouchers · search, sort, paginate"
        actions={<><button onClick={load} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">↻ Refresh</button>
          <Link href="/vouchers?new=1" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">+ New Voucher</Link></>} />
      {err && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{err} <button onClick={load} className="underline">retry</button></div>}
      <DataTable columns={columns} rows={rows} loading={loading}
        searchKeys={[(v) => v.voucher_no, (v) => v.narration, (v) => v.voucher_type, (v) => v.reference]}
        searchPlaceholder="Search voucher no, type, narration…" />
    </main>
  );
}
