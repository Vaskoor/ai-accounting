"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { money } from "@/lib/format";

type Dash = {
  cards: { income: number; expenses: number; netProfit: number; cash: number; bank: number; receivable: number; payable: number; stockValue: number };
  monthly: { month: string; income: number; expense: number }[];
  recent: any[];
};

const toneMap: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  sky: "bg-sky-50 text-sky-700 border-sky-200",
};

export default function Home() {
  const [data, setData] = useState<Dash | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData).catch((e) => setErr(String(e)));
  }, []);

  const cards = data
    ? [
        { label: "Total Income", value: data.cards.income, tone: "emerald", icon: "IN" },
        { label: "Total Expenses", value: data.cards.expenses, tone: "rose", icon: "EX" },
        { label: "Net Profit", value: data.cards.netProfit, tone: "sky", icon: "=" },
        { label: "Stock Value", value: data.cards.stockValue, tone: "amber", icon: "ST" },
      ]
    : [];

  const monthly = data?.monthly || [];
  const maxBar = Math.max(1, ...monthly.map((m) => Math.max(m.income, m.expense)));

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Live double-entry overview</p>
        </div>
        <Link href="/vouchers?new=1" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
          + New Voucher
        </Link>
      </header>

      {err && <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{err}</p>}

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{c.label}</span>
              <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs ${toneMap[c.tone]}`}>{c.icon}</span>
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{money(c.value)}</p>
          </div>
        ))}
        {!data && <p className="text-sm text-slate-400">Loading...</p>}
      </section>

      <section className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-6 text-sm font-semibold text-slate-700">Income vs Expense</h2>
          <div className="flex h-48 items-end justify-between gap-3">
            {monthly.map((m) => (
              <div key={m.month} className="flex h-full flex-1 flex-col items-center gap-2">
                <div className="flex h-full w-full items-end justify-center gap-1">
                  <div className="w-1/2 rounded-t bg-emerald-500" style={{ height: `${(m.income / maxBar) * 100}%` }} title={money(m.income)} />
                  <div className="w-1/2 rounded-t bg-rose-400" style={{ height: `${(m.expense / maxBar) * 100}%` }} title={money(m.expense)} />
                </div>
                <span className="text-xs text-slate-500">{m.month.slice(5)}</span>
              </div>
            ))}
            {monthly.length === 0 && <p className="text-sm text-slate-400">No data yet.</p>}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Balances</h2>
          {data && (
            <ul className="space-y-3 text-sm">
              {([["Cash", data.cards.cash], ["Bank", data.cards.bank], ["Receivable", data.cards.receivable], ["Payable", -data.cards.payable]] as [string, number][]).map(([label, val]) => (
                <li key={label} className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-semibold text-slate-900">{money(val)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-sm font-semibold text-slate-700">Recent Vouchers</h2>
          <Link href="/vouchers" className="text-xs text-slate-500 hover:text-slate-900">View all</Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-6 py-3 font-medium">Voucher</th>
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Narration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(data?.recent || []).map((v) => (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-mono text-xs text-slate-500">{v.voucher_no}</td>
                <td className="px-6 py-3 font-medium text-slate-800">{v.voucher_type}</td>
                <td className="px-6 py-3 text-slate-500">{v.date}</td>
                <td className="px-6 py-3 text-slate-500">{v.narration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}