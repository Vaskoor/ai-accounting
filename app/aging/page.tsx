"use client";
import { useEffect, useState } from "react";
import { money } from "@/lib/format";

type Row = { id: number; party: string; type: string; outstanding: number; bucket: string; credit_days: number; credit_limit: number };
type Data = { rows: Row[]; summary: { bucket: string; amount: number }[] };

export default function AgingPage() {
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<"Customer" | "Supplier">("Customer");

  useEffect(() => { fetch("/api/aging").then((r) => r.json()).then(setData); }, []);

  const rows = (data?.rows || []).filter((r) => r.type === tab);
  const buckets = ["0-30", "31-60", "61-90", "90+"];

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Aging Analysis</h1>

      <div className="mb-6 flex gap-2">
        {(["Customer", "Supplier"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"}`}>
            {t === "Customer" ? "Receivables" : "Payables"}
          </button>
        ))}
      </div>

      <section className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {buckets.map((b) => {
          const amt = (data?.summary || []).find((s) => s.bucket === b)?.amount || 0;
          return (
            <div key={b} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{b} days</span>
              <p className="mt-2 text-xl font-semibold text-slate-900">{money(amt)}</p>
            </div>
          );
        })}
      </section>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-6 py-3 font-medium">Party</th>
              <th className="px-6 py-3 text-right font-medium">Outstanding</th>
              <th className="px-6 py-3 font-medium">Bucket</th>
              <th className="px-6 py-3 text-right font-medium">Credit Days</th>
              <th className="px-6 py-3 text-right font-medium">Credit Limit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => {
              const overLimit = r.credit_limit > 0 && r.outstanding > r.credit_limit;
              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-800">{r.party}</td>
                  <td className={`px-6 py-3 text-right font-semibold ${overLimit ? "text-rose-600" : "text-slate-900"}`}>{money(r.outstanding)}</td>
                  <td className="px-6 py-3 text-slate-500">{r.bucket}</td>
                  <td className="px-6 py-3 text-right text-slate-500">{r.credit_days}</td>
                  <td className="px-6 py-3 text-right text-slate-500">{money(r.credit_limit)}</td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={5} className="px-6 py-6 text-center text-slate-400">No data.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}