"use client";
import { useEffect, useState } from "react";

type Log = { id: number; action: string; entity: string; entity_id: number | null; detail: string; created_at: string };

export default function AuditPage() {
  const [rows, setRows] = useState<Log[]>([]);
  useEffect(() => { fetch("/api/audit").then((r) => r.json()).then(setRows); }, []);

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Audit Log</h1>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-6 py-3 font-medium">Action</th>
              <th className="px-6 py-3 font-medium">Entity</th>
              <th className="px-6 py-3 font-medium">Detail</th>
              <th className="px-6 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="px-6 py-3"><span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{l.action}</span></td>
                <td className="px-6 py-3 text-slate-700">{l.entity}{l.entity_id ? ` #${l.entity_id}` : ""}</td>
                <td className="px-6 py-3 text-slate-500">{l.detail}</td>
                <td className="px-6 py-3 text-xs text-slate-400">{l.created_at}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="px-6 py-6 text-center text-slate-400">No audit entries yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}