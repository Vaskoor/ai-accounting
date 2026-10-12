import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();

  const ledgerBalances = db
    .prepare(
      `SELECT l.name, l.group_name,
        l.opening_balance +
        COALESCE(SUM(CASE WHEN ve.entry_type='Dr' THEN ve.amount ELSE 0 END),0) -
        COALESCE(SUM(CASE WHEN ve.entry_type='Cr' THEN ve.amount ELSE 0 END),0) AS balance
       FROM ledgers l
       LEFT JOIN voucher_entries ve ON ve.ledger_id = l.id
       GROUP BY l.id`
    )
    .all() as any[];

  const income = ledgerBalances.filter((r) => r.group_name === "Income").reduce((s, r) => s + Math.abs(r.balance), 0);
  const expenses = ledgerBalances.filter((r) => r.group_name === "Expenses").reduce((s, r) => s + r.balance, 0);
  const cash = ledgerBalances.find((r) => r.name === "Cash")?.balance || 0;
  const bank = ledgerBalances.find((r) => r.name === "Bank")?.balance || 0;
  const receivable = ledgerBalances.find((r) => r.name === "Accounts Receivable")?.balance || 0;
  const payable = Math.abs(ledgerBalances.find((r) => r.name === "Accounts Payable")?.balance || 0);

  const monthly = db
    .prepare(
      `SELECT substr(v.date,1,7) AS month,
        SUM(CASE WHEN l.group_name='Income' THEN ve.amount ELSE 0 END) AS income,
        SUM(CASE WHEN l.group_name='Expenses' THEN ve.amount ELSE 0 END) AS expense
       FROM vouchers v
       JOIN voucher_entries ve ON ve.voucher_id = v.id
       JOIN ledgers l ON l.id = ve.ledger_id
       GROUP BY month ORDER BY month`
    )
    .all();

  const recent = db.prepare("SELECT * FROM vouchers ORDER BY date DESC, id DESC LIMIT 8").all();

  const stockValue = db.prepare("SELECT COALESCE(SUM(rate*quantity),0) AS v FROM stock_items").get() as { v: number };

  return NextResponse.json({
    cards: { income, expenses, netProfit: income - expenses, cash, bank, receivable, payable, stockValue: stockValue.v },
    monthly,
    recent,
  });
}