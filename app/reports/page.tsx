"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { money } from "@/lib/format";

const types = [
  { id: "day-book", label: "Day Book" },
  { id: "cash-flow", label: "Cash Flow" },
  { id: "ratio", label: "Ratios" },
  { id: "trial-balance", label: "Trial Balance" },
  { id: "profit-loss", label: "Profit & Loss" },
  { id: "balance-sheet", label: "Balance Sheet" },
];

function Card({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-2 text-xl font-bold tabular ${tone || "text-slate-900 dark:text-white"}`}>{value}</p>
    </div>
  );
}

export default function ReportsPage() {
  const [type, setType] = useState("day-book");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const load = useCallback(() => {
    setLoading(true); setErr("");
    fetch(`/api/reports?type=${type}`).then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }).then(setData).catch((e) => setErr(String(e))).finally(() => setLoading(false));
  }, [type]);
  useEffect(() => { load(); }, [load]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader title="Reports" subtitle="Day book · cash flow · ratios · financial statements"
        actions={<Link href="/financial-statements" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">Financial Statements →</Link>} />

      <div className="mb-6 flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {types.map((t) => (
          <button key={t.id} onClick={() => setType(t.id)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${type === t.id ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}>{t.label}</button>
        ))}
      </div>

      {err && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{err} <button onClick={load} className="underline">retry</button></div>}
      {loading ? <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" />)}</div> : !data ? null : (
        <div className="space-y-4">
          {type === "day-book" && (data.vouchers || []).map((v: any) => (
            <div key={v.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{v.voucher_no} · {v.voucher_type}</span>
                <span className="text-xs text-slate-400">{v.date}</span>
              </div>
              <p className="mb-3 text-sm text-slate-700 dark:text-slate-200">{v.narration}</p>
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(v.entries || []).map((e: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-1.5 text-slate-700 dark:text-slate-200">{e.ledger}</td>
                      <td className="py-1.5 text-right tabular">{e.entry_type === "Dr" ? money(e.amount) : ""}</td>
                      <td className="py-1.5 text-right tabular">{e.entry_type === "Cr" ? money(e.amount) : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          ))}

          {type === "cash-flow" && (<>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Card label="Total Inflows" value={money(data.inflows?.reduce((s: number, f: any) => s + f.amount, 0) || 0)} tone="text-emerald-600 dark:text-emerald-400" />
              <Card label="Total Outflows" value={money(data.outflows?.reduce((s: number, f: any) => s + f.amount, 0) || 0)} tone="text-rose-600 dark:text-rose-400" />
              <Card label="Net Cash" value={money(data.net || 0)} tone={data.net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"} />
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-sm"><thead><tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400 dark:border-slate-800"><th className="px-4 py-2">Date</th><th className="px-4 py-2">Type</th><th className="px-4 py-2">Against</th><th className="px-4 py-2 text-right">In</th><th className="px-4 py-2 text-right">Out</th></tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(data.inflows || []).map((f: any, i: number) => (<tr key={"in" + i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50"><td className="px-4 py-2">{f.date}</td><td className="px-4 py-2">{f.voucher_type}</td><td className="px-4 py-2 text-slate-500">{f.against || "—"}</td><td className="px-4 py-2 text-right tabular text-emerald-600 dark:text-emerald-400">{money(f.amount)}</td><td /></tr>))}
                  {(data.outflows || []).map((f: any, i: number) => (<tr key={"out" + i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50"><td className="px-4 py-2">{f.date}</td><td className="px-4 py-2">{f.voucher_type}</td><td className="px-4 py-2 text-slate-500">{f.against || "—"}</td><td /><td className="px-4 py-2 text-right tabular text-rose-600 dark:text-rose-400">{money(f.amount)}</td></tr>))}
                </tbody></table>
            </div>
          </>)}

          {type === "ratio" && (<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Card label="Current Ratio" value={(data.currentRatio || 0).toFixed(2)} />
            <Card label="Debt to Equity" value={(data.debtToEquity || 0).toFixed(2)} />
            <Card label="Net Profit Margin" value={(data.netProfitMargin || 0).toFixed(1) + "%"} />
            <Card label="Return on Equity" value={(data.returnOnEquity || 0).toFixed(1) + "%"} />
            <Card label="Current Assets" value={money(data.currentAssets || 0)} />
            <Card label="Current Liabilities" value={money(data.currentLiabilities || 0)} />
          </div>)}

          {type === "trial-balance" && (<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-slate-800"><h3 className="text-sm font-semibold">Trial Balance</h3>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] ${data.balanced ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"}`}>{data.balanced ? "Balanced" : "Out of balance"}</span></div>
            <table className="w-full text-sm"><thead><tr className="border-b border-slate-100 text-xs uppercase text-slate-400 dark:border-slate-800"><th className="px-4 py-2 text-left">Account</th><th className="px-4 py-2 text-right">Debit</th><th className="px-4 py-2 text-right">Credit</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(data.rows || []).filter((r: any) => Math.abs(r.balance) > 0.01).map((r: any) => (<tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50"><td className="px-4 py-2">{r.name}</td><td className="px-4 py-2 text-right tabular">{r.balance > 0 ? money(r.balance) : "—"}</td><td className="px-4 py-2 text-right tabular">{r.balance < 0 ? money(Math.abs(r.balance)) : "—"}</td></tr>))}
                <tr className="border-t-2 border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"><td className="px-4 py-2 font-bold">Total</td><td className="px-4 py-2 text-right tabular font-bold">{money(data.totalDr)}</td><td className="px-4 py-2 text-right tabular font-bold">{money(data.totalCr)}</td></tr>
              </tbody></table>
          </div>)}

          {type === "profit-loss" && (<div className="space-y-4">
            <div className="grid grid-cols-3 gap-4"><Card label="Total Income" value={money(data.totalIncome || 0)} tone="text-emerald-600 dark:text-emerald-400" /><Card label="Total Expenses" value={money(data.totalExpense || 0)} tone="text-rose-600 dark:text-rose-400" /><Card label="Net Profit" value={money(data.netProfit || 0)} tone={data.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"} /></div>
          </div>)}

          {type === "balance-sheet" && (<div className="grid grid-cols-3 gap-4">
            <Card label="Total Assets" value={money(data.totalAssets || 0)} />
            <Card label="Total Liabilities" value={money(data.totalLiabilities || 0)} />
            <Card label="Total Equity" value={money(data.totalEquity || 0)} />
          </div>)}
        </div>
      )}
    </main>
  );
}
