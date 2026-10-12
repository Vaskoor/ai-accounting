import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.prepare("SELECT * FROM stock_items ORDER BY name").all());
}

export async function POST(req: Request) {
  try {
    const { name, unit, rate, quantity, hsn, gst_rate } = await req.json();
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
    const db = getDb();
    const info = db
      .prepare("INSERT INTO stock_items (name, unit, rate, quantity, hsn, gst_rate) VALUES (?, ?, ?, ?, ?, ?)")
      .run(name, unit || "pcs", Number(rate) || 0, Number(quantity) || 0, hsn || "", Number(gst_rate) || 0);
    return NextResponse.json(db.prepare("SELECT * FROM stock_items WHERE id = ?").get(info.lastInsertRowid), { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}