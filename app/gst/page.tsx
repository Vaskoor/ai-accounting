"use client";
import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { money } from "@/lib/format";

function Card({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold tabular ${tone || "text-slate-900 dark:text-white"}`}>{value}</p>
    </div>
  );
}

export default function GstPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const load = useCallback(() => {
    setLoading(true); setErr("");
    fetch("/api/gst").then((r) => r.json()).then(setData).catch((e) => setErr(String(e))).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const net = data?.netPayable ?? 0;
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader title="VAT / Tax Summary" subtitle="Nepali VAT 13% · output tax vs input tax"
        actions={<button onClick={load} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">↻ Refresh</button>} />
      {err && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{err} <button onClick={load} className="underline">retry</button></div>}
      {loading ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}</div> : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card label="Output VAT (Sales)" value={money(data.outputTax || 0)} tone="text-rose-600 dark:text-rose-400" />
            <Card label="Input VAT (Purchases)" value={money(data.inputTax || 0)} tone="text-emerald-600 dark:text-emerald-400" />
            <Card label="Net Payable" value={money(Math.abs(net))} tone={net >= 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"} />
            <Card label="Avg Rate" value={(data.avgRate || 0).toFixed(1) + "%"} />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
            <Card label="Taxable Sales" value={money(data.taxableSales || 0)} tone="text-emerald-600 dark:text-emerald-400" />
            <Card label="Taxable Purchases" value={money(data.taxablePurchases || 0)} tone="text-amber-600 dark:text-amber-400" />
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-800"><h3 className="text-sm font-semibold">VAT by Rate</h3></div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400 dark:border-slate-800"><th className="px-4 py-2">Rate</th><th className="px-4 py-2">Items at this rate</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(data.byRate || []).filter((b: any) => (b.items || []).length > 0).map((b: any) => (
                  <tr key={b.rate} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-2 font-semibold">{b.rate}%</td>
                    <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{(b.items || []).map((i: any) => i.name).join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </main>
  );
}
