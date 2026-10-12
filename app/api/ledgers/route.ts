import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM ledgers ORDER BY group_name, name").all();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, group_name, opening_balance } = body;
    if (!name || !group_name) {
      return NextResponse.json({ error: "name and group_name required" }, { status: 400 });
    }
    const db = getDb();
    const info = db
      .prepare("INSERT INTO ledgers (name, group_name, opening_balance) VALUES (?, ?, ?)")
      .run(name, group_name, Number(opening_balance) || 0);
    const row = db.prepare("SELECT * FROM ledgers WHERE id = ?").get(info.lastInsertRowid);
    return NextResponse.json(row, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}