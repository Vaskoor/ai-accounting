import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { signedOpening } from "@/lib/accounting";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "trial-balance";
  const db = getDb();

  const ledgerBalances = db
    .prepare(
      `SELECT l.id, l.name, l.group_name, l.sub_group, l.opening_balance,
        COALESCE(SUM(CASE WHEN ve.entry_type='Dr' THEN ve.amount ELSE 0 END),0) AS debits,
        COALESCE(SUM(CASE WHEN ve.entry_type='Cr' THEN ve.amount ELSE 0 END),0) AS credits
       FROM ledgers l
       LEFT JOIN voucher_entries ve ON ve.ledger_id = l.id
       GROUP BY l.id
       ORDER BY l.group_name, l.name`
    )
    .all() as any[];

  const rows = ledgerBalances.map((l) => {
    const signed = signedOpening(l.opening_balance, l.group_name) + l.debits - l.credits;
    return { id: l.id, name: l.name, group: l.group_name, sub_group: l.sub_group, opening: l.opening_balance, debits: l.debits, credits: l.credits, balance: signed };
  });

  if (type === "trial-balance") {
    const totalDr = rows.filter((r) => r.balance > 0).reduce((s, r) => s + r.balance, 0);
    const totalCr = rows.filter((r) => r.balance < 0).reduce((s, r) => s + Math.abs(r.balance), 0);
    const groups: Record<string, { dr: number; cr: number }> = {};
    for (const r of rows) {
      if (!groups[r.group]) groups[r.group] = { dr: 0, cr: 0 };
      if (r.balance > 0) groups[r.group].dr += r.balance;
      else groups[r.group].cr += Math.abs(r.balance);
    }
    return NextResponse.json({ type, rows, totalDr, totalCr, balanced: Math.abs(totalDr - totalCr) < 0.01, groups });
  }

  if (type === "profit-loss") {
    const income = rows.filter((r) => r.group === "Income");
    const expenses = rows.filter((r) => r.group === "Expenses");
    const totalIncome = income.reduce((s, r) => s + Math.abs(r.balance), 0);
    const totalExpense = expenses.reduce((s, r) => s + r.balance, 0);
    return NextResponse.json({ type, income, expenses, totalIncome, totalExpense, netProfit: totalIncome - totalExpense });
  }

  if (type === "balance-sheet") {
    const assets = rows.filter((r) => r.group === "Assets");
    const liabilities = rows.filter((r) => r.group === "Liabilities");
    const equity = rows.filter((r) => r.group === "Equity");
    const income = rows.filter((r) => r.group === "Income");
    const expenses = rows.filter((r) => r.group === "Expenses");
    const totalIncome = income.reduce((s, r) => s + Math.abs(r.balance), 0);
    const totalExpense = expenses.reduce((s, r) => s + r.balance, 0);
    const netProfit = totalIncome - totalExpense;
    const totalAssets = assets.reduce((s, r) => s + r.balance, 0);
    const totalLiabilities = liabilities.reduce((s, r) => s + Math.abs(r.balance), 0);
    const totalEquity = equity.reduce((s, r) => s + Math.abs(r.balance), 0) + netProfit;
    return NextResponse.json({
      type, assets, liabilities, equity, netProfit, totalAssets, totalLiabilities, totalEquity,
      balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    });
  }

  if (type === "day-book") {
    const vouchers = db.prepare("SELECT * FROM vouchers ORDER BY date DESC, id DESC").all() as any[];
    const entryStmt = db.prepare(
      `SELECT ve.amount, ve.entry_type, l.name AS ledger
       FROM voucher_entries ve JOIN ledgers l ON l.id = ve.ledger_id
       WHERE ve.voucher_id = ?`
    );
    return NextResponse.json({ type, vouchers: vouchers.map((v) => ({ ...v, entries: entryStmt.all(v.id) })) });
  }

  if (type === "cash-flow") {
    const cashLedgers = db.prepare("SELECT id, name FROM ledgers WHERE name IN ('Cash','Bank')").all() as any[];
    const ids = cashLedgers.map((c) => c.id);
    if (ids.length === 0) return NextResponse.json({ type, inflows: [], outflows: [], net: 0 });
    const placeholders = ids.map(() => "?").join(",");
    const flows = db
      .prepare(
        `SELECT v.date, v.voucher_type, v.narration, ve.entry_type, ve.amount,
                (SELECT l2.name FROM voucher_entries ve2 JOIN ledgers l2 ON l2.id = ve2.ledger_id
                 WHERE ve2.voucher_id = v.id AND ve2.ledger_id NOT IN (${placeholders}) LIMIT 1) AS against
         FROM voucher_entries ve JOIN vouchers v ON v.id = ve.voucher_id
         WHERE ve.ledger_id IN (${placeholders})
         ORDER BY v.date, v.id`
      )
      .all(...ids, ...ids) as any[];
    const inflows = flows.filter((f) => f.entry_type === "Dr");
    const outflows = flows.filter((f) => f.entry_type === "Cr");
    const net = inflows.reduce((s, f) => s + f.amount, 0) - outflows.reduce((s, f) => s + f.amount, 0);
    return NextResponse.json({ type, inflows, outflows, net });
  }

  if (type === "ratio") {
    const assets = rows.filter((r) => r.group === "Assets").reduce((s, r) => s + r.balance, 0);
    const liabilities = rows.filter((r) => r.group === "Liabilities").reduce((s, r) => s + Math.abs(r.balance), 0);
    const equity = rows.filter((r) => r.group === "Equity").reduce((s, r) => s + Math.abs(r.balance), 0);
    const income = rows.filter((r) => r.group === "Income").reduce((s, r) => s + Math.abs(r.balance), 0);
    const expenses = rows.filter((r) => r.group === "Expenses").reduce((s, r) => s + r.balance, 0);
    const currentAssets = rows.filter((r) => r.group === "Assets" && r.sub_group === "Current Assets").reduce((s, r) => s + r.balance, 0);
    const currentLiabilities = rows.filter((r) => r.group === "Liabilities" && r.sub_group === "Current Liabilities").reduce((s, r) => s + Math.abs(r.balance), 0);
    const netProfit = income - expenses;
    return NextResponse.json({
      type,
      currentRatio: currentLiabilities ? currentAssets / currentLiabilities : 0,
      debtToEquity: equity ? liabilities / equity : 0,
      netProfitMargin: income ? (netProfit / income) * 100 : 0,
      returnOnEquity: equity ? (netProfit / equity) * 100 : 0,
      currentAssets,
      currentLiabilities,
      netProfit,
    });
  }

  return NextResponse.json({ error: "unknown report type" }, { status: 400 });
}