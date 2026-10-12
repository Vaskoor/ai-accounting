"use client";
import { useEffect, useState } from "react";
import { money } from "@/lib/format";

type Row = { id: number; ledger_id: number; ledger: string; grp: string; period: string; amount: number; actual: number };
type Ledger = { id: number; name: string; group_name: string };

export default function BudgetsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [form, setForm] = useState({ ledger_id: "", period: "2025-10", amount: "" });
  const [msg, setMsg] = useState("");

  const load = () => fetch("/api/budgets").then((r) => r.json()).then(setRows);
  useEffect(() => {
    load();
    fetch("/api/ledgers").then((r) => r.json()).then((ls) => setLedgers(ls.filter((l: Ledger) => l.group_name === "Expenses" || l.group_name === "Income")));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/budgets", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ledger_id: Number(form.ledger_id), period: form.period, amount: Number(form.amount) }),
    });
    if (r.ok) { setForm({ ...form, amount: "" }); setMsg("Budget saved"); load(); }
    else { const j = await r.json(); setMsg(j.error || "Error"); }
  }

  const field = "rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900";
  const totalBudget = rows.reduce((s, r) => s + r.amount, 0);
  const totalActual = rows.reduce((s, r) => s + r.actual, 0);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Budgets</h1>
        <span className="text-sm text-slate-500">Budget <b className="text-slate-900">{money(totalBudget)}</b> / Actual <b className="text-slate-900">{money(totalActual)}</b></span>
      </div>

      <form onSubmit={submit} className="mb-8 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-4">
        <select required value={form.ledger_id} onChange={(e) => setForm({ ...form, ledger_id: e.target.value })} className={field}>
          <option value="">Select ledger...</option>
          {ledgers.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.group_name})</option>)}
        </select>
        <input required placeholder="Period (YYYY-MM)" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} className={field} />
        <input required type="number" placeholder="Budget amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={field} />
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">Set Budget</button>
        {msg && <p className="col-span-full text-sm text-slate-500">{msg}</p>}
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-6 py-3 font-medium">Ledger</th>
              <th className="px-6 py-3 font-medium">Period</th>
              <th className="px-6 py-3 text-right font-medium">Budget</th>
              <th className="px-6 py-3 text-right font-medium">Actual</th>
              <th className="px-6 py-3 text-right font-medium">Variance</th>
              <th className="px-6 py-3 font-medium">Used</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => {
              const variance = r.amount - r.actual;
              const pct = r.amount ? Math.min(100, (r.actual / r.amount) * 100) : 0;
              const over = r.actual > r.amount;
              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-800">{r.ledger}</td>
                  <td className="px-6 py-3 text-slate-500">{r.period}</td>
                  <td className="px-6 py-3 text-right text-slate-600">{money(r.amount)}</td>
                  <td className="px-6 py-3 text-right text-slate-600">{money(r.actual)}</td>
                  <td className={`px-6 py-3 text-right font-medium ${variance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{money(variance)}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-slate-100">
                        <div className={`h-2 rounded-full ${over ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{pct.toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={6} className="px-6 py-6 text-center text-slate-400">No budgets set.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}