import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { signedOpening } from "@/lib/accounting";

export const dynamic = "force-dynamic";

// Full account statement (like Tally's Ledger Vouchers view) with running balance.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ledgerId = Number(searchParams.get("ledger_id"));
  if (!ledgerId) return NextResponse.json({ error: "ledger_id required" }, { status: 400 });

  const db = getDb();
  const ledger = db.prepare("SELECT * FROM ledgers WHERE id = ?").get(ledgerId) as any;
  if (!ledger) return NextResponse.json({ error: "ledger not found" }, { status: 404 });

  const entries = db
    .prepare(
      `SELECT v.id, v.voucher_no, v.voucher_type, v.date, v.narration, v.reference,
              ve.amount, ve.entry_type
       FROM voucher_entries ve JOIN vouchers v ON v.id = ve.voucher_id
       WHERE ve.ledger_id = ?
       ORDER BY v.date, v.id`
    )
    .all(ledgerId) as any[];

  let running = signedOpening(ledger.opening_balance, ledger.group_name);
  const rows = entries.map((e) => {
    running += e.entry_type === "Dr" ? e.amount : -e.amount;
    return { ...e, running };
  });

  return NextResponse.json({
    ledger: { id: ledger.id, name: ledger.name, group: ledger.group_name, opening: ledger.opening_balance },
    opening: signedOpening(ledger.opening_balance, ledger.group_name),
    rows,
    closing: running,
  });
}