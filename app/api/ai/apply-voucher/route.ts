import { NextResponse } from "next/server";
import { getDb, logAudit } from "@/lib/db";

export const dynamic = "force-dynamic";

// get-or-create a ledger by name; auto-create missing accounts (VAT Receivable, vendor-specific, etc.)
function ledgerId(name: string, group = "Expenses", sub: string | null = null): number {
  const db = getDb();
  const ex = db.prepare("SELECT id FROM ledgers WHERE name = ?").get(name) as { id: number } | undefined;
  if (ex) return ex.id;
  db.prepare("INSERT INTO ledgers (name, group_name, sub_group, opening_balance) VALUES (?, ?, ?, 0)")
    .run(name, group, sub);
  logAudit("create-ledger", "ledgers", null, `auto-created ledger "${name}" (${group})`);
  return (db.prepare("SELECT id FROM ledgers WHERE name = ?").get(name) as { id: number }).id;
}

function nextVoucherNo(type: string): string {
  const db = getDb();
  const year = new Date().getFullYear();
  const prefix = type === "Sales" ? "SAL" : type === "Purchase" ? "PUR"
    : type === "Receipt" ? "RCT" : type === "Payment" ? "PAY" : "JRN";
  const row = db.prepare("SELECT voucher_no FROM vouchers WHERE voucher_no LIKE ? ORDER BY id DESC LIMIT 1")
    .get(`${prefix}-${year}-%`) as { voucher_no: string } | undefined;
  let n = 1;
  if (row) {
    const m = row.voucher_no.match(/(\d+)$/);
    if (m) n = parseInt(m[1], 10) + 1;
  }
  return `${prefix}-${year}-${String(n).padStart(3, "0")}`;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const db = getDb();

  try {
    let voucherType: string;
    let narration: string;
    let date: string;
    let reference: string | null = null;
    let lines: { ledger: string; amount: number; type: "Dr" | "Cr"; group?: string; sub?: string | null }[];

    if (body.bill) {
      // build from an extracted bill
      const b = body.bill;
      voucherType = b.bill_type === "sales" ? "Sales" : b.bill_type === "purchase" ? "Purchase" : "Purchase";
      const total = Number(b.total) || 0;
      const vatAmt = Number(b.vat_amount) || 0;
      const net = total - vatAmt;
      const dateStr = b.bill_date || new Date().toISOString().slice(0, 10);
      date = dateStr;
      narration = `${b.vendor || "Vendor"} bill ${b.bill_number || ""}`.trim();
      reference = b.bill_number || null;
      // cash vs credit: if user marked cash, Cr Cash/Bank; else Cr Accounts Payable
      const creditTo = body.cash ? "Bank" : "Accounts Payable";
      lines = [];
      // debit the expense / purchase (net)
      lines.push({ ledger: "Office Supplies", amount: net, type: "Dr", group: "Expenses" });
      // debit VAT receivable if VAT applies
      if (vatAmt > 0) {
        lines.push({ ledger: "VAT Receivable", amount: vatAmt, type: "Dr", group: "Assets", sub: "Current Assets" });
      }
      lines.push({ ledger: creditTo, amount: total, type: "Cr", group: creditTo === "Bank" ? "Assets" : "Liabilities" });
    } else if (body.voucher) {
      // direct voucher from the chat (already-structured)
      const v = body.voucher;
      voucherType = v.voucher_type || "Journal";
      narration = v.narration || "AI entry";
      date = v.date || new Date().toISOString().slice(0, 10);
      reference = v.reference || null;
      lines = (v.lines || []).map((l: any) => ({
        ledger: l.ledger, amount: Number(l.amount), type: l.type, group: l.group, sub: l.sub,
      }));
    } else {
      return NextResponse.json({ error: "provide {bill} or {voucher}" }, { status: 400 });
    }

    // validate balance
    const dr = lines.filter((l) => l.type === "Dr").reduce((s, l) => s + l.amount, 0);
    const cr = lines.filter((l) => l.type === "Cr").reduce((s, l) => s + l.amount, 0);
    if (Math.abs(dr - cr) > 0.01) {
      return NextResponse.json({ error: `not balanced: Dr=${dr} Cr=${cr}` }, { status: 400 });
    }
    if (lines.length < 2) {
      return NextResponse.json({ error: "need at least 2 lines" }, { status: 400 });
    }

    const vno = nextVoucherNo(voucherType);
    const ins = db.transaction(() => {
      const r = db.prepare(
        "INSERT INTO vouchers (voucher_no, voucher_type, date, narration, reference) VALUES (?, ?, ?, ?, ?)",
      ).run(vno, voucherType, date, narration, reference);
      const vid = Number(r.lastInsertRowid);
      const insE = db.prepare(
        "INSERT INTO voucher_entries (voucher_id, ledger_id, amount, entry_type) VALUES (?, ?, ?, ?)",
      );
      for (const l of lines) {
        const lid = ledgerId(l.ledger, l.group, l.sub);
        insE.run(vid, lid, l.amount, l.type);
      }
      return vid;
    });
    const vid = ins();
    logAudit("ai-create-voucher", "vouchers", vid, `${voucherType} ${vno} — ${narration}`);
    return NextResponse.json({
      ok: true, voucher_id: vid, voucher_no: vno, voucher_type: voucherType,
      date, narration, lines, dr, cr,
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
