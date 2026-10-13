"use client";
import { useEffect, useState, useCallback } from "react";
import { money } from "@/lib/format";

type Row = { id: number; name: string; group: string; sub_group?: string; opening: number; debits: number; credits: number; balance: number };

const tabs = [
  { id: "trial-balance", label: "Trial Balance" },
  { id: "profit-loss", label: "Profit & Loss" },
  { id: "balance-sheet", label: "Balance Sheet" },
] as const;

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 ${right ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}
function Td({ children, right, bold }: { children: React.ReactNode; right?: boolean; bold?: boolean }) {
  return (
    <td className={`px-3 py-2 text-sm ${right ? "text-right tabular" : ""} ${bold ? "font-semibold text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-200"}`}>
      {children}
    </td>
  );
}

function SectionCard({ title, children, badge }: { title: string; children: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
        {badge}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-slate-100 dark:border-slate-800">
            <Th>Account</Th><Th right>Debit</Th><Th right>Credit</Th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export default function FinancialStatements() {
  const [tab, setTab] = useState<typeof tabs[number]["id"]>("trial-balance");
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true); setErr("");
    fetch(`/api/reports?type=${tab}`)
      .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(setData).catch((e) => setErr(String(e))).finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const balanceBadge = (ok: boolean) => (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${ok ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"}`}>
      {ok ? "Balanced" : "Out of balance"}
    </span>
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Financial Statements</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Trial Balance · Profit &amp; Loss · Balance Sheet — generated from the live ledger</p>
      </header>

      {/* tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {err && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {err} <button onClick={load} className="ml-2 underline">retry</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : tab === "trial-balance" && data ? (
        <SectionCard title="Trial Balance" badge={balanceBadge(data.balanced)}>
          {data.rows?.filter((r: Row) => Math.abs(r.balance) > 0.01).map((r: Row) => (
            <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <Td>{r.name}</Td>
              <Td right>{r.balance > 0 ? money(r.balance) : "—"}</Td>
              <Td right>{r.balance < 0 ? money(Math.abs(r.balance)) : "—"}</Td>
            </tr>
          ))}
          <tr className="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <Td bold>Total</Td>
            <Td bold right>{money(data.totalDr)}</Td>
            <Td bold right>{money(data.totalCr)}</Td>
          </tr>
        </SectionCard>
      ) : tab === "profit-loss" && data ? (
        <div className="space-y-4">
          <SectionCard title="Income">
            {data.income?.map((r: Row) => (
              <tr key={r.id}><Td>{r.name}</Td><Td right>—</Td><Td right>{money(Math.abs(r.balance))}</Td></tr>
            ))}
            <tr className="border-t border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              <Td bold>Total Income</Td><Td right>—</Td><Td bold right>{money(data.totalIncome)}</Td>
            </tr>
          </SectionCard>
          <SectionCard title="Expenses">
            {data.expenses?.map((r: Row) => (
              <tr key={r.id}><Td>{r.name}</Td><Td right>{money(r.balance)}</Td><Td right>—</Td></tr>
            ))}
            <tr className="border-t border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              <Td bold>Total Expenses</Td><Td bold right>{money(data.totalExpense)}</Td><Td right>—</Td>
            </tr>
          </SectionCard>
          <div className={`rounded-xl border p-5 text-center ${data.netProfit >= 0 ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40" : "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40"}`}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Net Profit</p>
            <p className={`mt-1 text-3xl font-bold tabular ${data.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {money(data.netProfit)}
            </p>
          </div>
        </div>
      ) : tab === "balance-sheet" && data ? (
        <div className="space-y-4">
          <SectionCard title="Assets" badge={balanceBadge(data.balanced)}>
            {data.assets?.map((r: Row) => (
              <tr key={r.id}><Td>{r.name}</Td><Td right>{money(r.balance)}</Td><Td right>—</Td></tr>
            ))}
            <tr className="border-t border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              <Td bold>Total Assets</Td><Td bold right>{money(data.totalAssets)}</Td><Td right>—</Td>
            </tr>
          </SectionCard>
          <SectionCard title="Liabilities">
            {data.liabilities?.map((r: Row) => (
              <tr key={r.id}><Td>{r.name}</Td><Td right>—</Td><Td right>{money(Math.abs(r.balance))}</Td></tr>
            ))}
            <tr className="border-t border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              <Td bold>Total Liabilities</Td><Td right>—</Td><Td bold right>{money(data.totalLiabilities)}</Td>
            </tr>
          </SectionCard>
          <SectionCard title="Equity (+ Net Profit)">
            {data.equity?.map((r: Row) => (
              <tr key={r.id}><Td>{r.name}</Td><Td right>—</Td><Td right>{money(Math.abs(r.balance))}</Td></tr>
            ))}
            <tr><Td>Net Profit (period)</Td><Td right>—</Td><Td right>{money(data.netProfit)}</Td></tr>
            <tr className="border-t border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              <Td bold>Total Equity</Td><Td right>—</Td><Td bold right>{money(data.totalEquity)}</Td>
            </tr>
          </SectionCard>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-wide text-slate-400">Total Assets</p>
              <p className="mt-1 text-xl font-bold tabular text-slate-900 dark:text-white">{money(data.totalAssets)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-wide text-slate-400">Liabilities + Equity</p>
              <p className="mt-1 text-xl font-bold tabular text-slate-900 dark:text-white">{money(data.totalLiabilities + data.totalEquity)}</p>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
