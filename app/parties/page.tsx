"use client";
import { useEffect, useState } from "react";

type Party = { id: number; name: string; type: string; gstin: string; phone: string; email: string; address: string };

export default function PartiesPage() {
  const [rows, setRows] = useState<Party[]>([]);
  const [form, setForm] = useState({ name: "", type: "Customer", gstin: "", phone: "", email: "", address: "" });
  const [msg, setMsg] = useState("");

  const load = () => fetch("/api/parties").then((r) => r.json()).then(setRows);
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/parties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (r.ok) { setForm({ name: "", type: "Customer", gstin: "", phone: "", email: "", address: "" }); setMsg("Party created"); load(); }
    else { const j = await r.json(); setMsg(j.error || "Error"); }
  }

  const field = "rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900";

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Parties</h1>

      <form onSubmit={submit} className="mb-8 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-3">
        <input required placeholder="Party name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={field}>
          <option>Customer</option><option>Supplier</option>
        </select>
        <input placeholder="GSTIN" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} className={field} />
        <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={field} />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
        <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={field} />
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 sm:col-span-3">Add Party</button>
        {msg && <p className="col-span-full text-sm text-slate-500">{msg}</p>}
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 font-medium">GSTIN</th>
              <th className="px-6 py-3 font-medium">Phone</th>
              <th className="px-6 py-3 font-medium">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-medium text-slate-800">{p.name}</td>
                <td className="px-6 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${p.type === "Customer" ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700"}`}>{p.type}</span></td>
                <td className="px-6 py-3 font-mono text-xs text-slate-500">{p.gstin || "-"}</td>
                <td className="px-6 py-3 text-slate-500">{p.phone || "-"}</td>
                <td className="px-6 py-3 text-slate-500">{p.email || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}