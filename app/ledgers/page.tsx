"use client";
import { useEffect, useState } from "react";
import { money } from "@/lib/format";

type Ledger = { id: number; name: string; group_name: string; opening_balance: number };

export default function LedgersPage() {
  const [rows, setRows] = useState<Ledger[]>([]);
  const [form, setForm] = useState({ name: "", group_name: "Assets", opening_balance: "0" });
  const [msg, setMsg] = useState("");

  const load = () => fetch("/api/ledgers").then((r) => r.json()).then(setRows);
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const r = await fetch("/api/ledgers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, opening_balance: Number(form.opening_balance) }),
    });
    if (r.ok) {
      setForm({ name: "", group_name: "Assets", opening_balance: "0" });
      setMsg("Ledger created");
      load();
    } else {
      const j = await r.json();
      setMsg(j.error || "Error");
    }
  }

  const groups = ["Assets", "Liabilities", "Equity", "Income", "Expenses"];
  const field = "rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900";

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Ledgers</h1>

      <form onSubmit={submit} className="mb-8 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-4">
        <input required placeholder="Ledger name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
        <select value={form.group_name} onChange={(e) => setForm({ ...form, group_name: e.target.value })} className={field}>
          {groups.map((g) => <option key={g}>{g}</option>)}
        </select>
        <input type="number" placeholder="Opening balance" value={form.opening_balance} onChange={(e) => setForm({ ...form, opening_balance: e.target.value })} className={field} />
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">Add Ledger</button>
        {msg && <p className="col-span-full text-sm text-slate-500">{msg}</p>}
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Group</th>
              <th className="px-6 py-3 text-right font-medium">Opening Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-medium text-slate-800">{l.name}</td>
                <td className="px-6 py-3 text-slate-500">{l.group_name}</td>
                <td className="px-6 py-3 text-right font-semibold text-slate-900">{money(l.opening_balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}