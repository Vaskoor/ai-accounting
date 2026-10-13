"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { money } from "@/lib/format";
import { fiscalYearLabel } from "@/lib/nepali-date";

type Dash = {
  cards: { income: number; expenses: number; netProfit: number; cash: number; bank: number; receivable: number; payable: number; stockValue: number };
  monthly: { month: string; income: number; expense: number }[];
  recent: any[];
};
type ExpenseRow = { ledger: string; total: number };

const palette = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

const toneMap: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
  amber: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  rose: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900",
  sky: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900",
  violet: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900",
};

function Card({ label, value, tone, icon, hint }: { label: string; value: number; tone: string; icon: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${toneMap[tone]}`}>{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold tabular text-slate-900 dark:text-white">{money(value)}</p>
      {hint && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  );
}

function Skeleton() {
  return <div className="skeleton h-28 w-full rounded-xl" />;
}

// pure-SVG donut chart
function Donut({ rows, total }: { rows: ExpenseRow[]; total: number }) {
  const size = 160, stroke = 28, r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  let offset = 0;
  const slices = rows.slice(0, 8).map((row, i) => {
    const frac = total > 0 ? row.total / total : 0;
    const len = frac * circ;
    const s = { ...row, color: palette[i % palette.length], len, start: offset };
    offset += len;
    return s;
  });
  const top5 = slices.slice(0, 5);
  const otherTotal = slices.slice(5).reduce((s, r) => s + r.total, 0);
  const legend = otherTotal > 0 ? [...top5, { ledger: "Other", total: otherTotal, color: "#94a3b8" }] : top5;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-100 dark:text-slate-800" />
        {slices.map((s, i) => (
          <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={s.color}
            strokeWidth={stroke} strokeDasharray={`${s.len} ${circ - s.len}`} strokeDashoffset={-s.start}
            transform={`rotate(-90 ${size/2} ${size/2})`} className="transition-all duration-500">
            <title>{s.ledger}: {money(s.total)}</title>
          </circle>
        ))}
        <text x="50%" y="46%" textAnchor="middle" className="fill-slate-400 text-[10px] uppercase">Total</text>
        <text x="50%" y="56%" textAnchor="middle" className="fill-slate-900 dark:fill-white font-bold" style={{ fontSize: 13 }}>{money(total)}</text>
      </svg>
      <ul className="space-y-1.5 text-xs">
        {legend.map((s) => (
          <li key={s.ledger} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="flex-1 text-slate-600 dark:text-slate-300">{s.ledger}</span>
            <span className="font-medium tabular text-slate-900 dark:text-white">{money(s.total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState<Dash | null>(null);
  const [exp, setExp] = useState<{ rows: ExpenseRow[]; total: number } | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true); setErr("");
    Promise.all([
      fetch("/api/dashboard").then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }),
      fetch("/api/expense-breakdown").then((r) => r.json()).catch(() => ({ rows: [], total: 0 })),
    ]).then(([d, e]) => { setData(d); setExp(e); })
      .catch((e) => setErr(String(e))).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const c = data?.cards;
  const cards = c ? [
    { label: "Total Income", value: c.income, tone: "emerald", icon: "IN", hint: `${c.income > 0 ? Math.round((c.netProfit / c.income) * 100) : 0}% margin` },
    { label: "Total Expenses", value: c.expenses, tone: "rose", icon: "EX", hint: "all payments" },
    { label: "Net Profit", value: c.netProfit, tone: c.netProfit >= 0 ? "sky" : "rose", icon: "=", hint: "income − expenses" },
    { label: "Stock Value", value: c.stockValue, tone: "amber", icon: "ST", hint: "inventory at cost" },
    { label: "Cash", value: c.cash, tone: "emerald", icon: "$" },
    { label: "Bank", value: c.bank, tone: "sky", icon: "B" },
    { label: "Receivable", value: c.receivable, tone: "amber", icon: "AR", hint: "owed to you" },
    { label: "Payable", value: c.payable, tone: "violet", icon: "AP", hint: "you owe" },
  ] : [];

  const monthly = data?.monthly || [];
  const maxBar = Math.max(1, ...monthly.map((m) => Math.max(m.income, m.expense)));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">FY {fiscalYearLabel()}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Live double-entry overview · Nepali fiscal year</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">↻ Refresh</button>
          <Link href="/vouchers?new=1" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700">+ New Voucher</Link>
        </div>
      </header>

      {err && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          <span>{err}</span><button onClick={load} className="underline">retry</button>
        </div>
      )}

      {/* summary cards */}
      <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)
          : cards.slice(0, 4).map((c) => <Card key={c.label} {...c} />)}
      </section>
      <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)
          : cards.slice(4).map((c) => <Card key={c.label} {...c} />)}
      </section>

      {/* charts */}
      <section className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Income vs Expense</h2>
            <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />Income</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-rose-400" />Expense</span>
            </div>
          </div>
          {loading ? <div className="skeleton h-52 w-full rounded" /> : monthly.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">No data yet — create a voucher.</p>
          ) : (
            <div className="flex h-52 items-end justify-between gap-3">
              {monthly.map((m) => {
                const net = m.income - m.expense;
                return (
                  <div key={m.month} className="group flex h-full flex-1 flex-col items-center gap-2">
                    <div className="relative flex h-full w-full items-end justify-center gap-1">
                      <div className="w-1/2 rounded-t bg-emerald-500 transition group-hover:bg-emerald-400" style={{ height: `${(m.income / maxBar) * 100}%` }} title={`Income: ${money(m.income)}`} />
                      <div className="w-1/2 rounded-t bg-rose-400 transition group-hover:bg-rose-300" style={{ height: `${(m.expense / maxBar) * 100}%` }} title={`Expense: ${money(m.expense)}`} />
                      <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100 dark:bg-white dark:text-slate-900">{money(net)} net</div>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{m.month.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Expense Breakdown</h2>
          {loading ? <div className="skeleton h-40 w-full rounded" /> : !exp || exp.rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No expenses recorded.</p>
          ) : <Donut rows={exp.rows} total={exp.total} />}
        </div>
      </section>

      {/* recent vouchers */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Recent Vouchers</h2>
          <Link href="/vouchers" className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">View all →</Link>
        </div>
        {loading ? <div className="space-y-2 p-6">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-10 w-full rounded" />)}</div>
          : (data?.recent || []).length === 0 ? <p className="p-6 text-center text-sm text-slate-400">No vouchers yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-t border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                <th className="px-6 py-3 font-medium">Voucher</th><th className="px-6 py-3 font-medium">Type</th><th className="px-6 py-3 font-medium">Date</th><th className="px-6 py-3 font-medium">Narration</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(data?.recent || []).map((v) => (
                  <tr key={v.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{v.voucher_no}</td>
                    <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-200">{v.voucher_type}</td>
                    <td className="px-6 py-3 text-slate-500 dark:text-slate-400">{v.date}</td>
                    <td className="px-6 py-3 text-slate-500 dark:text-slate-400">{v.narration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {data && c && (
        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          Totals: {money(c.income)} in · {money(c.expenses)} out · <span className={c.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>{money(c.netProfit)} net</span>
        </p>
      )}
    </main>
  );
}
