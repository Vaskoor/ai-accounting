"use client";
import { useEffect, useState } from "react";
import { money } from "@/lib/format";

const TABS = [
  { id: "trial-balance", label: "Trial Balance" },
  { id: "profit-loss", label: "Profit & Loss" },
  { id: "balance-sheet", label: "Balance Sheet" },
  { id: "cash-flow", label: "Cash Flow" },
  { id: "ratio", label: "Ratios" },
  { id: "day-book", label: "Day Book" },
];

export default function ReportsPage() {
  const [tab, setTab] = useState("trial-balance");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    setData(null);
    fetch(`/api/reports?type=${tab}`).then((r) => r.json()).then(setData);
  }, [tab]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Reports</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t.id ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {!data && <p className="text-sm text-slate-400">Loading...</p>}

      {data?.type === "trial-balance" && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-6 py-3 font-medium">Ledger</th>
                <th className="px-6 py-3 font-medium">Group</th>
                <th className="px-6 py-3 font-medium">Sub-group</th>
                <th className="px-6 py-3 text-right font-medium">Debit</th>
                <th className="px-6 py-3 text-right font-medium">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.rows.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-800">{r.name}</td>
                  <td className="px-6 py-3 text-slate-500">{r.group}</td>
                  <td className="px-6 py-3 text-slate-400">{r.sub_group || "-"}</td>
                  <td className="px-6 py-3 text-right text-slate-700">{r.balance > 0 ? money(r.balance) : ""}</td>
                  <td className="px-6 py-3 text-right text-slate-700">{r.balance < 0 ? money(-r.balance) : ""}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-200 font-semibold">
                <td className="px-6 py-3" colSpan={3}>Total</td>
                <td className="px-6 py-3 text-right">{money(data.totalDr)}</td>
                <td className="px-6 py-3 text-right">{money(data.totalCr)}</td>
              </tr>
            </tbody>
          </table>
          <p className={`px-6 py-3 text-xs ${data.balanced ? "text-emerald-600" : "text-rose-600"}`}>
            {data.balanced ? "Trial balance is balanced" : "Out of balance"}
          </p>
        </div>
      )}

      {data?.type === "profit-loss" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-emerald-700">Income</h2>
            <ul className="space-y-2 text-sm">
              {data.income.map((r: any) => (
                <li key={r.id} className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-600">{r.name}</span><span className="font-medium">{money(Math.abs(r.balance))}</span>
                </li>
              ))}
              <li className="flex justify-between pt-2 font-semibold"><span>Total Income</span><span>{money(data.totalIncome)}</span></li>
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-rose-700">Expenses</h2>
            <ul className="space-y-2 text-sm">
              {data.expenses.map((r: any) => (
                <li key={r.id} className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-600">{r.name}</span><span className="font-medium">{money(r.balance)}</span>
                </li>
              ))}
              <li className="flex justify-between pt-2 font-semibold"><span>Total Expenses</span><span>{money(data.totalExpense)}</span></li>
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Net Profit</span>
              <span className={`text-xl font-bold ${data.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{money(data.netProfit)}</span>
            </div>
          </div>
        </div>
      )}

      {data?.type === "balance-sheet" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Assets</h2>
            <ul className="space-y-2 text-sm">
              {data.assets.map((r: any) => (
                <li key={r.id} className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-600">{r.name}</span><span className="font-medium">{money(r.balance)}</span>
                </li>
              ))}
              <li className="flex justify-between pt-2 font-semibold"><span>Total Assets</span><span>{money(data.totalAssets)}</span></li>
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Liabilities & Equity</h2>
            <ul className="space-y-2 text-sm">
              {data.liabilities.map((r: any) => (
                <li key={r.id} className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-600">{r.name}</span><span className="font-medium">{money(Math.abs(r.balance))}</span>
                </li>
              ))}
              {data.equity.map((r: any) => (
                <li key={r.id} className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-600">{r.name}</span><span className="font-medium">{money(Math.abs(r.balance))}</span>
                </li>
              ))}
              <li className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-600">Net Profit</span><span className="font-medium">{money(data.netProfit)}</span>
              </li>
              <li className="flex justify-between pt-2 font-semibold"><span>Total Liab. + Equity</span><span>{money(data.totalLiabilities + data.totalEquity)}</span></li>
            </ul>
          </div>
          <p className={`lg:col-span-2 text-xs ${data.balanced ? "text-emerald-600" : "text-rose-600"}`}>
            {data.balanced ? "Balance sheet balances" : "Balance sheet out of balance"}
          </p>
        </div>
      )}

      {data?.type === "cash-flow" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-emerald-700">Inflows</h2>
            <ul className="space-y-2 text-sm">
              {data.inflows.map((f: any, i: number) => (
                <li key={i} className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-600">{f.date} · {f.against || f.voucher_type}</span>
                  <span className="font-medium text-emerald-700">{money(f.amount)}</span>
                </li>
              ))}
              {data.inflows.length === 0 && <li className="text-slate-400">None</li>}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-rose-700">Outflows</h2>
            <ul className="space-y-2 text-sm">
              {data.outflows.map((f: any, i: number) => (
                <li key={i} className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-600">{f.date} · {f.against || f.voucher_type}</span>
                  <span className="font-medium text-rose-700">{money(f.amount)}</span>
                </li>
              ))}
              {data.outflows.length === 0 && <li className="text-slate-400">None</li>}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Net Cash Flow</span>
              <span className={`text-xl font-bold ${data.net >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{money(data.net)}</span>
            </div>
          </div>
        </div>
      )}

      {data?.type === "ratio" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Current Ratio", value: data.currentRatio.toFixed(2), hint: "Current Assets / Current Liabilities" },
            { label: "Debt to Equity", value: data.debtToEquity.toFixed(2), hint: "Liabilities / Equity" },
            { label: "Net Profit Margin", value: data.netProfitMargin.toFixed(1) + "%", hint: "Net Profit / Income" },
            { label: "Return on Equity", value: data.returnOnEquity.toFixed(1) + "%", hint: "Net Profit / Equity" },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{k.label}</span>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{k.value}</p>
              <p className="mt-1 text-xs text-slate-400">{k.hint}</p>
            </div>
          ))}
        </div>
      )}

      {data?.type === "day-book" && (
        <div className="space-y-3">
          {data.vouchers.map((v: any) => (
            <div key={v.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-3">
                <span className="rounded-md bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">{v.voucher_type}</span>
                <span className="font-mono text-xs text-slate-500">{v.voucher_no}</span>
                <span className="text-xs text-slate-400">{v.date}</span>
                <span className="ml-auto text-xs text-slate-500">{v.narration}</span>
              </div>
              <div className="text-sm text-slate-600">
                {v.entries.map((e: any, i: number) => (
                  <span key={i} className="mr-4">{e.ledger} <b className="text-slate-900">{money(e.amount)}</b> <span className="text-slate-400">{e.entry_type}</span></span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}