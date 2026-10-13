"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "./ThemeProvider";
import { fiscalYearLabel } from "@/lib/nepali-date";

// inline SVG icons (no package dependency)
const I = {
  dash: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
  voucher: "M4 4h16v4H4V4zm0 8h16v8H4v-8zm2 2v4h6v-4H6z",
  ledger: "M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v2H8V8zm0 4h8v2H8v-2z",
  party: "M12 12a4 4 0 100-8 4 4 0 000 8zm-6 9a6 6 0 0112 0H4z",
  stock: "M3 7l9-4 9 4-9 4-9-4zm0 5l9 4 9-4M3 17l9 4 9-4",
  stmt: "M5 3h14a1 1 0 011 1v16a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1zm2 4h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z",
  report: "M12 3v18M3 12h18M5 5h14v14H5z",
  stmt2: "M9 17v-5h6v5h4V5H5v12h4zM3 21h18v-2H3v2z",
  aging: "M12 8v5l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z",
  gst: "M4 4h16v4H4V4zm2 8h5v8H6v-8zm7 0h5v8h-5v-8z",
  budget: "M3 17l6-6 4 4 7-7m0 0v6m0-6h-6",
  cc: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 4v8m0 4v2m-7-7h2m10 0h2",
  audit: "M4 4h16v16H4V4zm3 3h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z",
  chevron: "M9 5l7 7-7 7",
  sun: "M12 4V2m0 20v-2m8-6h2M2 12h2m14.5-6.5L21 5M3 19l1.5-1.5M17.5 17.5L19 19M3 5l1.5 1.5M12 8a4 4 0 100 8 4 4 0 000-8z",
  moon: "M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z",
  search: "M11 4a7 7 0 110 14 7 7 0 010-14zm7 14l4 4",
  menu: "M3 6h18M3 12h18M3 18h18",
  close: "M6 6l12 12M6 18L18 6",
};

function Icon({ d, cls = "h-4 w-4" }: { d: string; cls?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" className={cls}>
      <path d={d} />
    </svg>
  );
}

const groups = [
  {
    title: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: I.dash },
      { href: "/vouchers", label: "Vouchers", icon: I.voucher },
      { href: "/ledgers", label: "Chart of Accounts", icon: I.ledger },
      { href: "/parties", label: "Parties", icon: I.party },
      { href: "/stock", label: "Stock", icon: I.stock },
    ],
  },
  {
    title: "Reports",
    items: [
      { href: "/financial-statements", label: "Financial Statements", icon: I.stmt },
      { href: "/reports", label: "Reports", icon: I.report },
      { href: "/ledger-statement", label: "Ledger Statement", icon: I.stmt2 },
      { href: "/aging", label: "Aging Analysis", icon: I.aging },
      { href: "/gst", label: "VAT / Tax", icon: I.gst },
    ],
  },
  {
    title: "Planning",
    items: [
      { href: "/budgets", label: "Budgets", icon: I.budget },
      { href: "/cost-centers", label: "Cost Centers", icon: I.cc },
      { href: "/audit", label: "Audit Log", icon: I.audit },
    ],
  },
];

const allItems = groups.flatMap((g) => g.items);

export default function Sidebar() {
  const path = usePathname();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);

  useEffect(() => { setMobile(false); }, [path]);

  // Cmd/Ctrl+K opens search (handled by CommandPalette); collapse toggle on [ key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "[" && !e.metaKey && !e.ctrlKey) setCollapsed((c) => !c);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const fy = fiscalYearLabel();

  return (
    <>
      {/* mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-950/90">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 text-sm text-white">T</span>
          TallyWeb
        </Link>
        <button onClick={() => setMobile(true)} className="text-slate-600 dark:text-slate-300" aria-label="Open menu">
          <Icon d={I.menu} cls="h-6 w-6" />
        </button>
      </div>

      {/* mobile drawer */}
      {mobile && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobile(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute left-0 top-0 h-full w-72 overflow-y-auto border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarInner collapsed={false} groups={groups} isActive={isActive} theme={theme} onToggleTheme={toggle} fy={fy} onCollapse={() => setMobile(false)} />
          </div>
        </div>
      )}

      {/* desktop sidebar */}
      <aside
        className={`hidden shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:flex lg:flex-col ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <SidebarInner
          collapsed={collapsed} groups={groups} isActive={isActive} theme={theme}
          onToggleTheme={toggle} fy={fy} onCollapse={() => setCollapsed((c) => !c)}
        />
      </aside>
    </>
  );
}

function SidebarInner({
  collapsed, groups, isActive, theme, onToggleTheme, fy, onCollapse,
}: {
  collapsed: boolean;
  groups: any;
  isActive: (h: string) => boolean;
  theme: string;
  onToggleTheme: () => void;
  fy: string;
  onCollapse: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* brand */}
      <div className={`flex items-center gap-2 border-b border-slate-200 p-3 dark:border-slate-800 ${collapsed ? "justify-center" : ""}`}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">T</span>
        {!collapsed && <span className="font-bold text-slate-900 dark:text-white">TallyWeb</span>}
      </div>

      {/* nav */}
      <nav className="flex-1 overflow-y-auto p-2">
        {groups.map((g: any) => (
          <div key={g.title} className="mb-4">
            {!collapsed && (
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{g.title}</p>
            )}
            {g.items.map((item: any) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`group mb-0.5 flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition theme-tx ${
                    active
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  <Icon d={item.icon} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* footer */}
      <div className="border-t border-slate-200 p-2 dark:border-slate-800">
        {!collapsed && (
          <div className="mb-2 rounded-lg bg-slate-50 px-3 py-2 text-center dark:bg-slate-900">
            <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">Fiscal Year</p>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{fy}</p>
          </div>
        )}
        <div className={`flex ${collapsed ? "flex-col" : ""} gap-1`}>
          <button
            onClick={onToggleTheme}
            title="Toggle dark mode"
            className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 ${collapsed ? "justify-center" : ""}`}
          >
            <Icon d={theme === "dark" ? I.sun : I.moon} />
            {!collapsed && <span>{theme === "dark" ? "Light" : "Dark"}</span>}
          </button>
          <button
            onClick={onCollapse}
            title="Collapse ( [ )"
            className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 ${collapsed ? "justify-center" : ""}`}
          >
            <Icon d={I.chevron} cls={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
