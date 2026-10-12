"use client";
import { useEffect, useState } from "react";
import { money } from "@/lib/format";

type Data = {
  outputTax: number; inputTax: number; netPayable: number; avgRate: number;
  taxableSales: number; taxablePurchases: number;
  byRate: { rate: number; items: any[] }[];
};

export default function GstPage() {
  const [data, setData] = useState<Data | null>(null);
  useEffect(() => { fetch("/api/gst").then((r) => r.json()).then(setData); }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">GST Summary</h1>

      {data && (
        <>
          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-700">Output Tax (Sales)</span>
              <p className="mt-2 text-2xl font-semibold text-emerald-800">{money(data.outputTax)}</p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-5">
              <span className="text-xs font-medium uppercase tracking-wide text-sky-700">Input Tax (Purchases)</span>
              <p className="mt-2 text-2xl font-semibold text-sky-800">{money(data.inputTax)}</p>
            </div>
            <div className={`rounded-xl border p-5 ${data.netPayable >= 0 ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"}`}>
              <span className={`text-xs font-medium uppercase tracking-wide ${data.netPayable >= 0 ? "text-rose-700" : "text-slate-500"}`}>Net GST Payable</span>
              <p className={`mt-2 text-2xl font-semibold ${data.netPayable >= 0 ? "text-rose-800" : "text-slate-900"}`}>{money(data.netPayable)}</p>
            </div>
          </section>

          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs uppercase tracking-wide text-slate-500">Taxable Sales</span>
              <p className="mt-2 text-xl font-semibold text-slate-900">{money(data.taxableSales)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs uppercase tracking-wide text-slate-500">Taxable Purchases</span>
              <p className="mt-2 text-xl font-semibold text-slate-900">{money(data.taxablePurchases)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs uppercase tracking-wide text-slate-500">Avg. GST Rate</span>
              <p className="mt-2 text-xl font-semibold text-slate-900">{data.avgRate.toFixed(1)}%</p>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <h2 className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-700">Items by GST Rate</h2>
            <div className="divide-y divide-slate-100">
              {data.byRate.map((g) => (
                <div key={g.rate} className="px-6 py-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-md bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">{g.rate}%</span>
                    <span className="text-xs text-slate-500">{g.items.length} item(s)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {g.items.map((it) => (
                      <span key={it.id} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600">
                        {it.name} · {money(it.rate)} · qty {it.quantity}
                      </span>
                    ))}
                    {g.items.length === 0 && <span className="text-xs text-slate-400">None</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
      {!data && <p className="text-sm text-slate-400">Loading...</p>}
    </main>
  );
}