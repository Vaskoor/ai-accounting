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
      `SELECT l.id, l.name, l.group_name, l.opening_balance,
        COALESCE(SUM(CASE WHEN ve.entry_type='Dr' THEN ve.amount ELSE 0 END),0) AS debits,
        COALESCE(SUM(CASE WHEN ve.entry_type='Cr' THEN ve.amount ELSE 0 END),0) AS credits
       FROM ledgers l
       LEFT JOIN voucher_entries ve ON ve.ledger_id = l.id
       GROUP BY l.id
       ORDER BY l.group_name, l.name`
    )
    .all() as any[];

  // Signed balance: positive = debit, negative = credit
  const rows = ledgerBalances.map((l) => {
    const signed = signedOpening(l.opening_balance, l.group_name) + l.debits - l.credits;
    return { id: l.id, name: l.name, group: l.group_name, opening: l.opening_balance, debits: l.debits, credits: l.credits, balance: signed };
  });

  if (type === "trial-balance") {
    const totalDr = rows.filter((r) => r.balance > 0).reduce((s, r) => s + r.balance, 0);
    const totalCr = rows.filter((r) => r.balance < 0).reduce((s, r) => s + Math.abs(r.balance), 0);
    return NextResponse.json({ type, rows, totalDr, totalCr, balanced: Math.abs(totalDr - totalCr) < 0.01 });
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

  return NextResponse.json({ error: "unknown report type" }, { status: 400 });
}