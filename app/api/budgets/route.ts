import { NextResponse } from "next/server";
import { getDb, logAudit } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT b.id, b.ledger_id, l.name AS ledger, l.group_name AS grp, b.period, b.amount,
        COALESCE((SELECT SUM(ve.amount) FROM voucher_entries ve
          JOIN vouchers v ON v.id = ve.voucher_id
          WHERE ve.ledger_id = b.ledger_id
            AND substr(v.date,1,7) = b.period
            AND ((l.group_name IN ('Expenses') AND ve.entry_type='Dr')
              OR (l.group_name IN ('Income') AND ve.entry_type='Cr'))), 0) AS actual
       FROM budgets b JOIN ledgers l ON l.id = b.ledger_id
       ORDER BY b.period DESC, l.name`
    )
    .all();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    const { ledger_id, period, amount } = await req.json();
    if (!ledger_id || !period) return NextResponse.json({ error: "ledger_id and period required" }, { status: 400 });
    const db = getDb();
    const existing = db.prepare("SELECT id FROM budgets WHERE ledger_id = ? AND period = ?").get(ledger_id, period) as any;
    if (existing) {
      db.prepare("UPDATE budgets SET amount = ? WHERE id = ?").run(Number(amount) || 0, existing.id);
      logAudit("update", "budget", existing.id, `${period} = ${amount}`);
      return NextResponse.json(db.prepare("SELECT * FROM budgets WHERE id = ?").get(existing.id));
    }
    const info = db.prepare("INSERT INTO budgets (ledger_id, period, amount) VALUES (?, ?, ?)").run(ledger_id, period, Number(amount) || 0);
    logAudit("create", "budget", Number(info.lastInsertRowid), `${period} = ${amount}`);
    return NextResponse.json(db.prepare("SELECT * FROM budgets WHERE id = ?").get(info.lastInsertRowid), { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}