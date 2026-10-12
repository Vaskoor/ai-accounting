import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// Aging of receivables (customers) and payables (suppliers) based on open balances.
export async function GET() {
  const db = getDb();
  const parties = db.prepare("SELECT * FROM parties ORDER BY name").all() as any[];

  const buckets = (days: number) => {
    if (days <= 30) return "0-30";
    if (days <= 60) return "31-60";
    if (days <= 90) return "61-90";
    return "90+";
  };

  const rows = parties.map((p) => {
    const ledgerName = p.type === "Customer" ? "Accounts Receivable" : "Accounts Payable";
    const ledger = db.prepare("SELECT id FROM ledgers WHERE name = ?").get(ledgerName) as any;
    let balance = 0;
    if (ledger) {
      const agg = db
        .prepare(
          `SELECT COALESCE(SUM(CASE WHEN ve.entry_type='Dr' THEN ve.amount ELSE -ve.amount END),0) AS net
           FROM voucher_entries ve WHERE ve.ledger_id = ?`
        )
        .get(ledger.id) as { net: number };
      balance = agg.net;
    }
    // Distribute the party's share using their credit_days as a proxy age.
    const age = p.credit_days || 30;
    return {
      id: p.id,
      party: p.name,
      type: p.type,
      outstanding: Math.abs(balance),
      bucket: buckets(age),
      credit_days: age,
      credit_limit: p.credit_limit,
    };
  });

  const summary = ["0-30", "31-60", "61-90", "90+"].map((b) => ({
    bucket: b,
    amount: rows.filter((r) => r.bucket === b).reduce((s, r) => s + r.outstanding, 0),
  }));

  return NextResponse.json({ rows, summary });
}