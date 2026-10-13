"use client";
import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { money } from "@/lib/format";

type Ledger = { id: number; name: string; group_name: string };
type Row = { date: string; voucher_no: string; narration: string; debit: number; credit: number; balance: number };

export default function LedgerStatementPage() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [lid, setLid] = useState<number | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/ledgers").then((r) => r.json()).then((d: Ledger[]) => { setLedgers(d); if (d[0]) setLid(d[0].id); }).catch(() => {});
  }, []);

  const load = useCallback(() => {
    if (!lid) return;
    setLoading(true); setErr("");
    const q = new URLSearchParams();
    q.set("ledger_id", String(lid));
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    fetch(`/api/ledger-statement?${q}`).then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }).then((d) => setRows(d.rows || d || [])).catch((e) => setErr(String(e))).finally(() => setLoading(false));
  }, [lid, from, to]);

  useEffect(() => { if (lid) load(); }, [load]);

  const totalDr = rows.reduce((s, r) => s + (r.debit || 0), 0);
  const totalCr = rows.reduce((s, r) => s + (r.credit || 0), 0);
  const closing = rows.length ? rows[rows.length - 1].balance : 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader title="Ledger Statement" subtitle="Account-wise movement with running balance" />

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Ledger</label>
          <select value={lid ?? ""} onChange={(e) => setLid(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-sm dark:border-slate-700 dark:text-slate-200">
            {ledgers.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.group_name})</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-sm dark:border-slate-700 dark:text-slate-200" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-sm dark:border-slate-700 dark:text-slate-200" />
        </div>
        <button onClick={load} className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">Apply</button>
      </div>

      {err && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{err}</div>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
              <th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Voucher</th><th className="px-4 py-3 font-medium">Narration</th><th className="px-4 py-3 text-right font-medium">Debit</th><th className="px-4 py-3 text-right font-medium">Credit</th><th className="px-4 py-3 text-right font-medium">Balance</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? Array.from({ length: 5 }).map((_, i) => (<tr key={i}><td colSpan={6} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td></tr>)) :
                rows.length === 0 ? <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No movement in this period.</td></tr> :
                rows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{r.date}</td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-500 dark:text-slate-400">{r.voucher_no}</td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{r.narration}</td>
                    <td className="px-4 py-2 text-right tabular text-emerald-600 dark:text-emerald-400">{r.debit ? money(r.debit) : ""}</td>
                    <td className="px-4 py-2 text-right tabular text-rose-600 dark:text-rose-400">{r.credit ? money(r.credit) : ""}</td>
                    <td className="px-4 py-2 text-right tabular font-semibold">{money(r.balance)}</td>
                  </tr>
                ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot><tr className="border-t-2 border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <td colSpan={3} className="px-4 py-2 font-bold">Total</td>
                <td className="px-4 py-2 text-right tabular font-bold">{money(totalDr)}</td>
                <td className="px-4 py-2 text-right tabular font-bold">{money(totalCr)}</td>
                <td className="px-4 py-2 text-right tabular font-bold">{money(closing)}</td>
              </tr></tfoot>
            )}
          </table>
        </div>
      </div>
    </main>
  );
}
