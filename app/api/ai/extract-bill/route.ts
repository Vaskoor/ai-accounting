import { NextResponse } from "next/server";
import { vision, ApiKeyMissing } from "@/lib/grok";

export const dynamic = "force-dynamic";

const EXTRACT_PROMPT = `You are an OCR + accounting extraction engine for Nepali business bills (VAT invoices, receipts, purchase bills).

Extract the following fields from the image as a SINGLE JSON object. Use null for any field you cannot read. All money amounts are NUMBERS (no symbols). Dates are ISO YYYY-MM-DD.

{
  "vendor": "business / supplier name",
  "bill_date": "YYYY-MM-DD or null",
  "bill_number": "invoice/receipt number or null",
  "vat_pan_number": "PAN or VAT registration number visible, or null",
  "currency": "NPR",
  "items": [{"description": "...", "quantity": 1, "rate": 100, "amount": 100}],
  "subtotal": "sum of item amounts before VAT",
  "vat_rate": "13 if 13% VAT applies, 0 if zero-rated/exempt, null if unknown",
  "vat_amount": "VAT amount as a number, or null",
  "total": "grand total as a number",
  "bill_type": "sales|purchase|expense|receipt — best guess"
}

Return ONLY the JSON object, no prose, no markdown fences.`;

export async function POST(req: Request) {
  try {
    const ct = req.headers.get("content-type") || "";
    let imageB64 = "";
    let mime = "image/jpeg";

    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });
      mime = file.type || "image/jpeg";
      const buf = Buffer.from(await file.arrayBuffer());
      imageB64 = buf.toString("base64");
    } else {
      // JSON {image: base64, mime?: "..."}
      const { image, mime: m } = await req.json();
      if (!image) return NextResponse.json({ error: "no image" }, { status: 400 });
      imageB64 = image;
      mime = m || "image/jpeg";
    }

    const raw = await vision(imageB64, mime, EXTRACT_PROMPT);
    // strip any accidental fences
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
    let parsed: any = null;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // try to find the first {...} block
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }
    if (!parsed) return NextResponse.json({ error: "could not parse model output", raw: cleaned.slice(0, 400) }, { status: 502 });
    return NextResponse.json({ bill: parsed, raw_preview: cleaned.slice(0, 200) });
  } catch (e: any) {
    if (e instanceof ApiKeyMissing) {
      return NextResponse.json({ error: "no_key" }, { status: 200 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
