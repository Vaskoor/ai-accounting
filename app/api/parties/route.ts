import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.prepare("SELECT * FROM parties ORDER BY name").all());
}

export async function POST(req: Request) {
  try {
    const { name, type, gstin, phone, email, address } = await req.json();
    if (!name || !type) {
      return NextResponse.json({ error: "name and type required" }, { status: 400 });
    }
    const db = getDb();
    const info = db
      .prepare("INSERT INTO parties (name, type, gstin, phone, email, address) VALUES (?, ?, ?, ?, ?, ?)")
      .run(name, type, gstin || "", phone || "", email || "", address || "");
    return NextResponse.json(db.prepare("SELECT * FROM parties WHERE id = ?").get(info.lastInsertRowid), { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}