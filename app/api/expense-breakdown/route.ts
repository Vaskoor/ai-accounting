import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const rows = db.prepare(
    `SELECT l.name AS ledger, SUM(ve.amount) AS total
     FROM voucher_entries ve
     JOIN ledgers l ON l.id = ve.ledger_id
     WHERE l.group_name = 'Expenses' AND ve.entry_type = 'Dr'
     GROUP BY l.id
     ORDER BY total DESC`
  ).all() as { ledger: string; total: number }[];
  const total = rows.reduce((s, r) => s + r.total, 0);
  return NextResponse.json({ rows, total });
}
