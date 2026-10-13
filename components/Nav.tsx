"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "./ThemeProvider";

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
  const [mobile, setMobile] = useState(false);
  const { theme, toggle } = useTheme();

  const isActive = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);
  const moreActive = moreLinks.some((l) => isActive(l.href));

  // close mobile drawer on route change
  useEffect(() => {
    setMobile(false);
    setOpen(false);
  }, [path]);

  const allLinks = [...links, ...moreLinks];

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="mr-2 flex items-center gap-2 font-bold text-slate-900 dark:text-white sm:mr-4"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-sm text-white dark:bg-white dark:text-slate-900">
            T
          </span>
          <span className="hidden sm:inline">TallyWeb</span>
        </Link>

        {/* desktop primary links */}
        <div className="hidden flex-1 flex-wrap items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition theme-tx ${
                isActive(l.href)
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <div className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition theme-tx ${
                moreActive
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              More {open ? "\u25B4" : "\u25BE"}
            </button>
            {open && (
              <div className="absolute left-0 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {moreLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={`block px-4 py-2 text-sm transition theme-tx ${
                      isActive(l.href)
                        ? "bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-white"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={toggle}
            title="Toggle dark mode"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {theme === "dark" ? "\u2600\uFE0F" : "\u263D"}
          </button>
          <Link
            href="/vouchers?new=1"
            className="hidden rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700 sm:block"
          >
            + New
          </Link>
          {/* mobile hamburger */}
          <button
            onClick={() => setMobile((o) => !o)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Menu"
          >
            <span className="text-lg">{mobile ? "\u2715" : "\u2630"}</span>
          </button>
        </div>
      </div>

      {/* mobile drawer */}
      {mobile && (
        <div className="border-t border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-950 lg:hidden">
          {allLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`block rounded-lg px-3 py-2 text-sm transition theme-tx ${
                isActive(l.href)
                  ? "bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-white"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
