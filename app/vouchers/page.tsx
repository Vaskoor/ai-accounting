"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { money } from "@/lib/format";

type Ledger = { id: number; name: string; group_name: string };
type Entry = { ledger_id: string; amount: string; entry_type: "Dr" | "Cr" };
type Voucher = { id: number; voucher_no: string; voucher_type: string; date: string; narration: string; entries: any[] };

const TYPES = ["Sales", "Purchase", "Receipt", "Payment", "Journal", "Contra"];
const field = "rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900";

function VouchersInner() {
  const params = useSearchParams();
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    voucher_type: "Sales",
    date: new Date().toISOString().slice(0, 10),
    narration: "",
    entries: [
      { ledger_id: "", amount: "", entry_type: "Dr" as const },
      { ledger_id: "", amount: "", entry_type: "Cr" as const },
    ] as Entry[],
  });

  const load = () => fetch("/api/vouchers").then((r) => r.json()).then(setVouchers);

  useEffect(() => {
    fetch("/api/ledgers").then((r) => r.json()).then(setLedgers);
    load();
    if (params.get("new")) setShowForm(true);
  }, [params]);

  const debit = form.entries.filter((e) => e.entry_type === "Dr").reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const credit = form.entries.filter((e) => e.entry_type === "Cr").reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const balanced = Math.abs(debit - credit) < 0.001 && debit > 0;

  function setEntry(i: number, patch: Partial<Entry>) {
    const entries = form.entries.map((e, idx) => (idx === i ? { ...e, ...patch } : e));
    setForm({ ...form, entries });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const r = await fetch("/api/vouchers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voucher_type: form.voucher_type,
        date: form.date,
        narration: form.narration,
        entries: form.entries.map((x) => ({ ledger_id: Number(x.ledger_id), amount: Number(x.amount), entry_type: x.entry_type })),
      }),
    });
    if (r.ok) {
      setMsg("Voucher saved");
      setForm({ ...form, narration: "", entries: [{ ledger_id: "", amount: "", entry_type: "Dr" }, { ledger_id: "", amount: "", entry_type: "Cr" }] });
      load();
    } else {
      const j = await r.json();
      setMsg(j.error || "Error");
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Vouchers</h1>
        <button onClick={() => setShowForm((s) => !s)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
          {showForm ? "Close" : "+ New Voucher"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select value={form.voucher_type} onChange={(e) => setForm({ ...form, voucher_type: e.target.value })} className={field}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={field} />
            <input placeholder="Narration" value={form.narration} onChange={(e) => setForm({ ...form, narration: e.target.value })} className={field} />
          </div>

          <div className="space-y-2">
            {form.entries.map((en, i) => (
              <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                <select value={en.ledger_id} onChange={(e) => setEntry(i, { ledger_id: e.target.value })} className={`${field} sm:col-span-6`} required>
                  <option value="">Select ledger...</option>
                  {ledgers.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.group_name})</option>)}
                </select>
                <select value={en.entry_type} onChange={(e) => setEntry(i, { entry_type: e.target.value as "Dr" | "Cr" })} className={`${field} sm:col-span-2`}>
                  <option value="Dr">Dr</option><option value="Cr">Cr</option>
                </select>
                <input type="number" placeholder="Amount" value={en.amount} onChange={(e) => setEntry(i, { amount: e.target.value })} className={`${field} sm:col-span-3`} required />
                <button type="button" onClick={() => setForm({ ...form, entries: form.entries.filter((_, idx) => idx !== i) })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 sm:col-span-1">X</button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => setForm({ ...form, entries: [...form.entries, { ledger_id: "", amount: "", entry_type: "Dr" }] })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">+ Add line</button>
            <span className={`text-sm font-medium ${balanced ? "text-emerald-600" : "text-rose-600"}`}>
              Dr {money(debit)} / Cr {money(credit)} {balanced ? "- Balanced" : "- Not balanced"}
            </span>
            <button disabled={!balanced} className="ml-auto rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40">Save Voucher</button>
          </div>
          {msg && <p className="mt-3 text-sm text-slate-500">{msg}</p>}
        </form>
      )}

      <div className="space-y-3">
        {vouchers.map((v) => (
          <div key={v.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">{v.voucher_type}</span>
                <span className="font-mono text-xs text-slate-500">{v.voucher_no}</span>
                <span className="text-xs text-slate-400">{v.date}</span>
              </div>
              <span className="text-xs text-slate-500">{v.narration}</span>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {v.entries.map((e, i) => (
                  <tr key={i}>
                    <td className="py-1.5 text-slate-700">{e.ledger}</td>
                    <td className="py-1.5 text-right text-slate-400">{e.entry_type}</td>
                    <td className="py-1.5 text-right font-medium text-slate-900">{money(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {vouchers.length === 0 && <p className="text-sm text-slate-400">No vouchers yet.</p>}
      </div>
    </main>
  );
}

export default function VouchersPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-6xl px-6 py-8 text-sm text-slate-400">Loading...</main>}>
      <VouchersInner />
    </Suspense>
  );
}