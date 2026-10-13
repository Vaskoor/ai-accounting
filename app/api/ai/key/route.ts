import { NextResponse } from "next/server";
import { hasApiKey, setApiKey } from "@/lib/grok";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ has_key: hasApiKey() });
}

export async function POST(req: Request) {
  const { key } = await req.json().catch(() => ({}));
  const k = (key || "").trim();
  if (!k || !k.startsWith("xai-")) {
    return NextResponse.json({ error: "key must start with xai-" }, { status: 400 });
  }
  try {
    await setApiKey(k);
    return NextResponse.json({ ok: true, has_key: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
