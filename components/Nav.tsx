"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/vouchers", label: "Vouchers" },
  { href: "/ledgers", label: "Ledgers" },
  { href: "/parties", label: "Parties" },
  { href: "/stock", label: "Stock" },
];

const moreLinks = [
  { href: "/reports", label: "Reports" },
  { href: "/ledger-statement", label: "Ledger Statement" },
  { href: "/budgets", label: "Budgets" },
  { href: "/cost-centers", label: "Cost Centers" },
  { href: "/aging", label: "Aging" },
  { href: "/gst", label: "GST" },
  { href: "/audit", label: "Audit Log" },
];

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const moreActive = moreLinks.some((l) => isActive(l.href));

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-6 py-3">
        <Link href="/" className="mr-4 flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-sm text-white">T</span>
          TallyWeb
        </Link>
        {links.map((l) => (
          <Link key={l.href} href={l.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${isActive(l.href) ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
            {l.label}
          </Link>
        ))}
        <div className="relative">
          <button onClick={() => setOpen((o) => !o)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${moreActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
            More {open ? "\u25B4" : "\u25BE"}
          </button>
          {open && (
            <div className="absolute left-0 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              {moreLinks.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                  className={`block px-4 py-2 text-sm ${isActive(l.href) ? "bg-slate-100 font-medium text-slate-900" : "text-slate-600 hover:bg-slate-50"}`}>
                  {l.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}