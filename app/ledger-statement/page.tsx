"use client";
import { useEffect, useState } from "react";
import { money } from "@/lib/format";

type Ledger = { id: number; name: string; group_name: string };
type Row = { id: number; voucher_no: string; voucher_type: string; date: string; narration: string; reference: string; amount: number; entry_type: string; running: number };
type Statement = { ledger: { id: number; name: string; group: string; opening: number }; opening: number; rows: Row[]; closing: number };

export default function LedgerStatementPage() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [sel, setSel] = useState<string>("");
  const [data, setData] = useState<Statement | null>(null);

  useEffect(() => {
    fetch("/api/ledgers").then((r) => r.json()).then((ls: Ledger[]) => {
      setLedgers(ls);
      if (ls.length) setSel(String(ls[0].id));
    });
  }, []);

  useEffect(() => {
    if (!sel) return;
    setData(null);
    fetch(`/api/ledger-statement?ledger_id=${sel}`).then((r) => r.json()).then(setData);
  }, [sel]);

  const field = "rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900";

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Ledger Statement</h1>

      <select value={sel} onChange={(e) => setSel(e.target.value)} className={`${field} mb-6 w-full sm:w-80`}>
        {ledgers.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.group_name})</option>)}
      </select>

      {data && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-semibold text-slate-800">{data.ledger.name}</h2>
            <p className="text-xs text-slate-500">{data.ledger.group} · Opening balance {money(data.opening)}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Voucher</th>
                <th className="px-6 py-3 font-medium">Reference</th>
                <th className="px-6 py-3 font-medium">Narration</th>
                <th className="px-6 py-3 text-right font-medium">Debit</th>
                <th className="px-6 py-3 text-right font-medium">Credit</th>
                <th className="px-6 py-3 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 text-slate-500">{r.date}</td>
                  <td className="px-6 py-3"><span className="font-mono text-xs text-slate-500">{r.voucher_no}</span><span className="ml-2 text-xs text-slate-400">{r.voucher_type}</span></td>
                  <td className="px-6 py-3 font-mono text-xs text-slate-500">{r.reference || "-"}</td>
                  <td className="px-6 py-3 text-slate-600">{r.narration}</td>
                  <td className="px-6 py-3 text-right text-slate-700">{r.entry_type === "Dr" ? money(r.amount) : ""}</td>
                  <td className="px-6 py-3 text-right text-slate-700">{r.entry_type === "Cr" ? money(r.amount) : ""}</td>
                  <td className="px-6 py-3 text-right font-medium text-slate-900">{money(r.running)}</td>
                </tr>
              ))}
              {data.rows.length === 0 && <tr><td colSpan={7} className="px-6 py-6 text-center text-slate-400">No transactions.</td></tr>}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 font-semibold">
                <td className="px-6 py-3" colSpan={6}>Closing Balance</td>
                <td className="px-6 py-3 text-right">{money(data.closing)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      {!data && sel && <p className="text-sm text-slate-400">Loading...</p>}
    </main>
  );
}