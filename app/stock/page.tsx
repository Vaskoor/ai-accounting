"use client";
import { useEffect, useState } from "react";
import { money } from "@/lib/format";

type Item = { id: number; name: string; unit: string; rate: number; quantity: number; hsn: string; gst_rate: number };

export default function StockPage() {
  const [rows, setRows] = useState<Item[]>([]);
  const [form, setForm] = useState({ name: "", unit: "pcs", rate: "", quantity: "", hsn: "", gst_rate: "18" });
  const [msg, setMsg] = useState("");

  const load = () => fetch("/api/stock").then((r) => r.json()).then(setRows);
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, rate: Number(form.rate), quantity: Number(form.quantity), gst_rate: Number(form.gst_rate) }),
    });
    if (r.ok) { setForm({ name: "", unit: "pcs", rate: "", quantity: "", hsn: "", gst_rate: "18" }); setMsg("Item added"); load(); }
    else { const j = await r.json(); setMsg(j.error || "Error"); }
  }

  const field = "rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900";
  const totalValue = rows.reduce((s, r) => s + r.rate * r.quantity, 0);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Stock Items</h1>
        <span className="text-sm text-slate-500">Total value: <b className="text-slate-900">{money(totalValue)}</b></span>
      </div>

      <form onSubmit={submit} className="mb-8 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-6">
        <input required placeholder="Item name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`${field} sm:col-span-2`} />
        <input placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={field} />
        <input type="number" placeholder="Rate" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} className={field} />
        <input type="number" placeholder="Qty" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className={field} />
        <input placeholder="HSN" value={form.hsn} onChange={(e) => setForm({ ...form, hsn: e.target.value })} className={field} />
        <input type="number" placeholder="GST %" value={form.gst_rate} onChange={(e) => setForm({ ...form, gst_rate: e.target.value })} className={field} />
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 sm:col-span-5">Add Item</button>
        {msg && <p className="col-span-full text-sm text-slate-500">{msg}</p>}
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-6 py-3 font-medium">Item</th>
              <th className="px-6 py-3 font-medium">HSN</th>
              <th className="px-6 py-3 text-right font-medium">Rate</th>
              <th className="px-6 py-3 text-right font-medium">Qty</th>
              <th className="px-6 py-3 text-right font-medium">GST</th>
              <th className="px-6 py-3 text-right font-medium">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((it) => (
              <tr key={it.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-medium text-slate-800">{it.name}</td>
                <td className="px-6 py-3 font-mono text-xs text-slate-500">{it.hsn || "-"}</td>
                <td className="px-6 py-3 text-right text-slate-600">{money(it.rate)}</td>
                <td className="px-6 py-3 text-right text-slate-600">{it.quantity} {it.unit}</td>
                <td className="px-6 py-3 text-right text-slate-600">{it.gst_rate}%</td>
                <td className="px-6 py-3 text-right font-semibold text-slate-900">{money(it.rate * it.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}