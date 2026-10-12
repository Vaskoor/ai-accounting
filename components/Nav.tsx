"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/vouchers", label: "Vouchers" },
  { href: "/ledgers", label: "Ledgers" },
  { href: "/parties", label: "Parties" },
  { href: "/stock", label: "Stock" },
  { href: "/reports", label: "Reports" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-6 py-3">
        <Link href="/" className="mr-4 flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-sm text-white">T</span>
          TallyWeb
        </Link>
        {links.map((l) => {
          const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}