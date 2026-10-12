"use client";
import { useEffect, useState } from "react";

type CC = { id: number; name: string; parent_id: number | null };

export default function CostCentersPage() {
  const [rows, setRows] = useState<CC[]>([]);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => fetch("/api/cost-centers").then((r) => r.json()).then(setRows);
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/cost-centers", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }),
    });
    if (r.ok) { setName(""); setMsg("Cost center added"); load(); }
    else { const j = await r.json(); setMsg(j.error || "Error"); }
  }

  const field = "rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900";

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Cost Centers</h1>

      <form onSubmit={submit} className="mb-8 flex gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <input required placeholder="Cost center name" value={name} onChange={(e) => setName(e.target.value)} className={`${field} flex-1`} />
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">Add</button>
        {msg && <p className="text-sm text-slate-500">{msg}</p>}
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-6 py-3 font-medium">Cost Center</th>
              <th className="px-6 py-3 font-medium">Parent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-medium text-slate-800">{c.name}</td>
                <td className="px-6 py-3 text-slate-500">{rows.find((p) => p.id === c.parent_id)?.name || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}