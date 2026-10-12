import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const vouchers = db.prepare("SELECT * FROM vouchers ORDER BY date DESC, id DESC").all() as any[];
  const entryStmt = db.prepare(
    `SELECT ve.id, ve.amount, ve.entry_type, l.name AS ledger, l.group_name
     FROM voucher_entries ve JOIN ledgers l ON l.id = ve.ledger_id
     WHERE ve.voucher_id = ?`
  );
  const result = vouchers.map((v) => ({ ...v, entries: entryStmt.all(v.id) }));
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { voucher_no, voucher_type, date, narration, entries } = body;
    if (!voucher_type || !date || !Array.isArray(entries) || entries.length < 2) {
      return NextResponse.json({ error: "voucher_type, date and at least 2 entries required" }, { status: 400 });
    }
    let debit = 0, credit = 0;
    for (const e of entries) {
      const amt = Number(e.amount);
      if (!amt || amt <= 0) return NextResponse.json({ error: "each entry amount must be > 0" }, { status: 400 });
      if (e.entry_type === "Dr") debit += amt;
      else if (e.entry_type === "Cr") credit += amt;
      else return NextResponse.json({ error: "entry_type must be Dr or Cr" }, { status: 400 });
    }
    if (Math.abs(debit - credit) > 0.001) {
      return NextResponse.json({ error: `Voucher not balanced: Dr ${debit} vs Cr ${credit}` }, { status: 400 });
    }
    const db = getDb();
    const no = voucher_no || `${voucher_type.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const tx = db.transaction(() => {
      const v = db.prepare("INSERT INTO vouchers (voucher_no, voucher_type, date, narration) VALUES (?, ?, ?, ?)").run(no, voucher_type, date, narration || "");
      const vid = Number(v.lastInsertRowid);
      const insE = db.prepare("INSERT INTO voucher_entries (voucher_id, ledger_id, amount, entry_type) VALUES (?, ?, ?, ?)");
      for (const e of entries) insE.run(vid, Number(e.ledger_id), Number(e.amount), e.entry_type);
      return vid;
    });
    const vid = tx();
    const voucher = db.prepare("SELECT * FROM vouchers WHERE id = ?").get(vid);
    return NextResponse.json(voucher, { status: 201 });
  } catch (e: any) {
    const msg = e.message?.includes("UNIQUE") ? "Voucher number already exists" : e.message;
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}