"use client";
import { useState, useMemo } from "react";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  right?: boolean;
};

export default function DataTable<T>({
  columns, rows, loading, emptyText = "No records yet.",
  searchKeys, searchPlaceholder = "Search…", pageSize = 12,
}: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  emptyText?: string;
  searchKeys?: (keyof T | ((r: T) => string))[];
  searchPlaceholder?: string;
  pageSize?: number;
}) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let out = rows;
    if (q && searchKeys) {
      const ql = q.toLowerCase();
      out = out.filter((r) =>
        searchKeys.some((k) => {
          const v = typeof k === "function" ? k(r) : String((r as any)[k] ?? "");
          return v.toLowerCase().includes(ql);
        }),
      );
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col?.sortValue) {
        out = [...out].sort((a, b) => {
          const av = col.sortValue!(a), bv = col.sortValue!(b);
          const cmp = typeof av === "number" && typeof bv === "number"
            ? av - bv : String(av).localeCompare(String(bv));
          return sortDir === "asc" ? cmp : -cmp;
        });
      }
    }
    return out;
  }, [rows, q, searchKeys, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const cur = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(cur * pageSize, cur * pageSize + pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {searchKeys && (
        <div className="border-b border-slate-100 p-3 dark:border-slate-800">
          <input
            value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }}
            placeholder={searchPlaceholder}
            className="w-full max-w-xs rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-emerald-400 dark:border-slate-700 dark:text-slate-200"
          />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
              {columns.map((c) => (
                <th key={c.key}
                  className={`px-4 py-3 font-medium ${c.right ? "text-right" : ""} ${c.sortable ? "cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200" : ""}`}
                  onClick={() => c.sortable && toggleSort(c.key)}>
                  {c.header}
                  {c.sortable && sortKey === c.key && (sortDir === "asc" ? " ↑" : " ↓")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3"><div className="skeleton h-4 w-full rounded" /></td>
                  ))}
                </tr>
              ))
            ) : pageRows.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-slate-400">{emptyText}</td></tr>
            ) : (
              pageRows.map((row, i) => (
                <tr key={i} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  {columns.map((c) => (
                    <td key={c.key} className={`px-4 py-3 ${c.right ? "text-right tabular" : "text-slate-700 dark:text-slate-200"}`}>
                      {c.render ? c.render(row) : String((row as any)[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {filtered.length > pageSize && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <span>{filtered.length} records</span>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={cur === 0}
              className="rounded border border-slate-200 px-2 py-0.5 disabled:opacity-40 dark:border-slate-700">‹ prev</button>
            <span className="px-2 py-0.5">page {cur + 1} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={cur >= totalPages - 1}
              className="rounded border border-slate-200 px-2 py-0.5 disabled:opacity-40 dark:border-slate-700">next ›</button>
          </div>
        </div>
      )}
    </div>
  );
}
