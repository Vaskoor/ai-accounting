// lib/grok.ts — xAI Grok API client (OpenAI-compatible).
// Key resolution: GROK_API_KEY env var, then data/grok-key.txt.
import fs from "fs";
import path from "path";

const GROK_BASE = "https://api.x.ai/v1";
const KEY_FILE = path.join(process.cwd(), "data", "grok-key.txt");

export function getApiKey(): string {
  if (process.env.GROK_API_KEY) return process.env.GROK_API_KEY.trim();
  try {
    return fs.readFileSync(KEY_FILE, "utf8").trim();
  } catch {
    return "";
  }
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}

export async function setApiKey(key: string): Promise<void> {
  await fs.promises.mkdir(path.dirname(KEY_FILE), { recursive: true });
  await fs.promises.writeFile(KEY_FILE, key.trim(), "utf8");
}

type Msg = { role: string; content: string | any[] };

/** Text chat completion. Returns the assistant message text. */
export async function chat(
  messages: Msg[],
  opts: { model?: string; temperature?: number; json?: boolean } = {},
): Promise<string> {
  const key = getApiKey();
  if (!key) throw new ApiKeyMissing();
  const body: any = {
    model: opts.model || "grok-2-1212",
    messages,
    temperature: opts.temperature ?? 0.4,
  };
  if (opts.json) body.response_format = { type: "json_object" };
  const r = await fetch(`${GROK_BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`grok HTTP ${r.status}: ${(await r.text()).slice(0, 240)}`);
  const j: any = await r.json();
  return j.choices?.[0]?.message?.content || "";
}

/** Vision: send one image (base64) + a text prompt. Returns assistant text. */
export async function vision(
  imageBase64: string,
  mimeType: string,
  prompt: string,
): Promise<string> {
  const key = getApiKey();
  if (!key) throw new ApiKeyMissing();
  const body = {
    model: "grok-2-vision-1212",
    messages: [{
      role: "user",
      content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
      ],
    }],
    temperature: 0.1,
  };
  const r = await fetch(`${GROK_BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`grok vision HTTP ${r.status}: ${(await r.text()).slice(0, 240)}`);
  const j: any = await r.json();
  return j.choices?.[0]?.message?.content || "";
}

export class ApiKeyMissing extends Error {
  constructor() {
    super("No Grok API key set. POST /api/ai/key {\"key\":\"xai-...\"} or set GROK_API_KEY.");
  }
}

export const ACCOUNTING_SYSTEM_PROMPT = `You are TallyWeb AI, an expert Nepali accounting assistant built into a double-entry accounting app.

Your job:
1. Help the user with Nepali accounting — VAT (13% standard, zero-rated, exempt), TDS, fiscal year (Asoj 1 → Asoj end, Bikram Sambat), PAN, double-entry bookkeeping.
2. When the user describes a transaction in plain language ("I paid Rs 5000 rent today", "sold goods for 12000 to Acme including 13% VAT"), produce a double-entry voucher.

The app's chart of accounts (ledger names) includes:
Cash, Bank, Accounts Receivable, Accounts Payable, VAT Payable, TDS Payable, Capital,
Sales, Consulting Income, Salaries, Rent, Utilities, Office Supplies, Office Equipment.
(If the user mentions a new account, suggest a ledger name from this list or propose a new one.)

Nepali VAT: 13% standard. A VAT-inclusive bill of Rs 1130 has Rs 1000 taxable + Rs 130 VAT.
For a VAT-able purchase: Dr Expense (net) + Dr VAT Receivable (13%), Cr Accounts Payable (gross).

When you create an entry, ALWAYS include a fenced JSON block:
\`\`\`voucher
{"voucher_type":"Payment|Receipt|Sales|Purchase|Journal","narration":"...","date":"YYYY-MM-DD","lines":[{"ledger":"Rent","amount":5000,"type":"Dr"},{"ledger":"Bank","amount":5000,"type":"Cr"}]}
\`\`\`
Then give a one-line explanation. The lines MUST balance (sum Dr == sum Cr).

For VAT-inclusive sales: Dr Accounts Receivable (gross), Cr Sales (net), Cr VAT Payable (13%).
For VAT-inclusive purchases: Dr Expense/Purchase (net), Dr VAT Receivable (13%), Cr Accounts Payable (gross).

If the user uploads a bill image, the system extracts the data first; you then propose the voucher from the extracted JSON. Keep answers concise and Nepali-business-aware.`;
