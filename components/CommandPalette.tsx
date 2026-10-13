"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const I = {
  search: "M11 4a7 7 0 110 14 7 7 0 010-14zm7 14l4 4",
  arrow: "M5 12h14m-6-6l6 6-6 6",
};

const items = [
  { href: "/", label: "Dashboard", section: "Overview", icon: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" },
  { href: "/vouchers", label: "Vouchers", section: "Transactions", icon: "M4 4h16v4H4V4zm0 8h16v8H4v-8z" },
  { href: "/vouchers?new=1", label: "New Voucher", section: "Actions", icon: "M12 4v16m-8-8h16" },
  { href: "/ledgers", label: "Chart of Accounts", section: "Transactions", icon: "M4 4h16v16H4V4zm2 2v12h12V6H6z" },
  { href: "/parties", label: "Parties", section: "Transactions", icon: "M12 12a4 4 0 100-8 4 4 0 000 8z" },
  { href: "/stock", label: "Stock", section: "Transactions", icon: "M3 7l9-4 9 4-9 4-9-4z" },
  { href: "/financial-statements", label: "Financial Statements", section: "Reports", icon: "M5 3h14a1 1 0 011 1v16a1 1 0 01-1 1H5V3z" },
  { href: "/reports", label: "Reports", section: "Reports", icon: "M12 3v18M3 12h18" },
  { href: "/ledger-statement", label: "Ledger Statement", section: "Reports", icon: "M9 17v-5h6v5h4V5H5v12h4z" },
  { href: "/aging", label: "Aging Analysis", section: "Reports", icon: "M12 8v5l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { href: "/gst", label: "VAT / Tax", section: "Reports", icon: "M4 4h16v4H4V4z" },
  { href: "/budgets", label: "Budgets", section: "Planning", icon: "M3 17l6-6 4 4 7-7" },
  { href: "/cost-centers", label: "Cost Centers", section: "Planning", icon: "M12 2a10 10 0 100 20 10 10 0 000-20z" },
  { href: "/audit", label: "Audit Log", section: "Planning", icon: "M4 4h16v16H4V4z" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const filtered = items.filter((it) =>
    (it.label + " " + it.section).toLowerCase().includes(q.toLowerCase()),
  );

  useEffect(() => { setSel(0); }, [q]);

  const go = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === "Enter" && filtered[sel]) { e.preventDefault(); go(filtered[sel].href); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-slate-400">
            <path d={I.search} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search pages or actions…"
            className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
          />
          <kbd className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-400 dark:border-slate-700">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-1">
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-slate-400">No matches.</p>
          )}
          {filtered.map((it, i) => (
            <button
              key={it.href}
              onClick={() => go(it.href)}
              onMouseEnter={() => setSel(i)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                i === sel
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "text-slate-700 dark:text-slate-200"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0 opacity-70">
                <path d={it.icon} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="flex-1">{it.label}</span>
              <span className="text-[10px] uppercase tracking-wide text-slate-400">{it.section}</span>
            </button>
          ))}
        </div>
        <div className="border-t border-slate-200 px-4 py-2 text-[10px] text-slate-400 dark:border-slate-700">
          <kbd className="font-mono">↑↓</kbd> navigate · <kbd className="font-mono">↵</kbd> open · <kbd className="font-mono">esc</kbd> close
        </div>
      </div>
    </div>
  );
}
