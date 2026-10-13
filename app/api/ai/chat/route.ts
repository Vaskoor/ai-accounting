import { NextResponse } from "next/server";
import { chat, ACCOUNTING_SYSTEM_PROMPT, ApiKeyMissing } from "@/lib/grok";

export const dynamic = "force-dynamic";

// parse a ```voucher {json}``` fenced block out of Grok's reply
function extractVoucher(text: string): any | null {
  const m = text.match(/```voucher\s*\n([\s\S]*?)```/i);
  if (!m) return null;
  try {
    const v = JSON.parse(m[1].trim());
    // sanity: must have balancing lines
    const dr = (v.lines || []).filter((l: any) => l.type === "Dr").reduce((s: number, l: any) => s + l.amount, 0);
    const cr = (v.lines || []).filter((l: any) => l.type === "Cr").reduce((s: number, l: any) => s + l.amount, 0);
    if (Math.abs(dr - cr) > 0.01) return null;
    return v;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const { messages } = await req.json().catch(() => ({}));
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }
  try {
    const full = [
      { role: "system", content: ACCOUNTING_SYSTEM_PROMPT },
      ...messages.map((m: any) => ({ role: m.role || "user", content: m.content || "" })),
    ];
    const reply = await chat(full, { temperature: 0.3 });
    const voucher = extractVoucher(reply);
    // strip the voucher block from the visible reply
    const visible = reply.replace(/```voucher\s*\n[\s\S]*?```/i, "").trim();
    return NextResponse.json({ reply: visible, voucher });
  } catch (e: any) {
    if (e instanceof ApiKeyMissing) {
      return NextResponse.json({ error: "no_key", reply: "No Grok API key set. Open the AI Assistant and paste your xAI key (it starts with `xai-`). You can get one at console.x.ai." }, { status: 200 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
