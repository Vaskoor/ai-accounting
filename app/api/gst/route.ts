import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// GST summary: output tax on sales, input tax on purchases, net payable.
export async function GET() {
  const db = getDb();

  const stock = db.prepare("SELECT * FROM stock_items").all() as any[];
  const salesValue = db
    .prepare(
      `SELECT COALESCE(SUM(ve.amount),0) AS v FROM voucher_entries ve
       JOIN ledgers l ON l.id = ve.ledger_id
       WHERE l.group_name='Income' AND ve.entry_type='Cr'`
    )
    .get() as { v: number };
  const purchaseValue = db
    .prepare(
      `SELECT COALESCE(SUM(ve.amount),0) AS v FROM voucher_entries ve
       JOIN ledgers l ON l.id = ve.ledger_id
       WHERE l.group_name='Expenses' AND ve.entry_type='Dr'`
    )
    .get() as { v: number };

  const avgRate = stock.length ? stock.reduce((s, i) => s + i.gst_rate, 0) / stock.length : 18;
  const outputTax = (salesValue.v * avgRate) / 100;
  const inputTax = (purchaseValue.v * avgRate) / 100;

  const byRate = [5, 12, 18, 28].map((r) => ({
    rate: r,
    items: stock.filter((i) => i.gst_rate === r),
  }));

  return NextResponse.json({
    outputTax,
    inputTax,
    netPayable: outputTax - inputTax,
    avgRate,
    taxableSales: salesValue.v,
    taxablePurchases: purchaseValue.v,
    byRate,
  });
}