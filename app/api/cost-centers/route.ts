import { NextResponse } from "next/server";
import { getDb, logAudit } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.prepare("SELECT * FROM cost_centers ORDER BY name").all());
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
    const db = getDb();
    const info = db.prepare("INSERT INTO cost_centers (name) VALUES (?)").run(name);
    logAudit("create", "cost_center", Number(info.lastInsertRowid), name);
    return NextResponse.json(db.prepare("SELECT * FROM cost_centers WHERE id = ?").get(info.lastInsertRowid), { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}