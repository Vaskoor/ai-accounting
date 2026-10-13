"use client";
import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable, { Column } from "@/components/DataTable";
import { money } from "@/lib/format";

type Stock = { id: number; name: string; unit: string; rate: number; quantity: number; reorder_level: number; hsn: string | null; gst_rate: number };

export default function StockPage() {
  const [rows, setRows] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const load = useCallback(() => {
    setLoading(true); setErr("");
    fetch("/api/stock").then((r) => r.json()).then(setRows).catch((e) => setErr(String(e))).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const lowCount = rows.filter((s) => s.quantity <= s.reorder_level).length;

  const columns: Column<Stock>[] = [
    { key: "name", header: "Item", sortable: true, render: (s) => (
      <span className="font-medium text-slate-800 dark:text-slate-200">{s.name}
        {s.quantity <= s.reorder_level && <span className="ml-2 rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">low</span>}
      </span>) },
    { key: "unit", header: "Unit", render: (s) => <span className="text-slate-500 dark:text-slate-400">{s.unit}</span> },
    { key: "rate", header: "Rate", right: true, sortable: true, sortValue: (s) => s.rate, render: (s) => money(s.rate) },
    { key: "quantity", header: "Qty", right: true, sortable: true, sortValue: (s) => s.quantity, render: (s) => <span className={s.quantity <= s.reorder_level ? "font-semibold text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-200"}>{s.quantity}</span> },
    { key: "reorder_level", header: "Reorder At", right: true, render: (s) => <span className="text-slate-400">{s.reorder_level}</span> },
    { key: "value", header: "Stock Value", right: true, sortable: true, sortValue: (s) => s.rate * s.quantity, render: (s) => <span className="font-semibold">{money(s.rate * s.quantity)}</span> },
    { key: "gst_rate", header: "VAT %", right: true, render: (s) => <span className="text-slate-500 dark:text-slate-400">{s.gst_rate}%</span> },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader title="Stock" subtitle="Inventory items · low-stock items flagged in red"
        actions={<button onClick={load} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">↻ Refresh</button>} />
      {err && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{err} <button onClick={load} className="underline">retry</button></div>}
      {lowCount > 0 && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">⚠ {lowCount} item(s) at or below reorder level — restock soon.</div>}
      <DataTable columns={columns} rows={rows} loading={loading}
        searchKeys={["name", "hsn"]} searchPlaceholder="Search item, HSN…" />
    </main>
  );
}
