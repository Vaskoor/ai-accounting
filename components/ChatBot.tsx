"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; text: string; voucher?: any; bill?: any };

const I = {
  bot: "M12 2a3 3 0 013 3v1h2a3 3 0 013 3v3a3 3 0 01-3 3h-1v3a3 3 0 01-3 3H8a3 3 0 01-3-3v-3H4a3 3 0 01-3-3V9a3 3 0 013-3h2V5a3 3 0 013-3z",
  send: "M3 12l18-9-9 18-2-7-7-2z",
  clip: "M21 11l-9 9a5 5 0 01-7-7l9-9a3.5 3.5 0 015 5l-9 9a2 2 0 01-3-3l8-8",
  close: "M6 6l12 12M18 6L6 18",
  check: "M5 13l4 4L19 7",
};

function esc(s: string) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function renderMd(t: string) {
  let h = esc(t);
  h = h.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _l, c) => "<pre><code>" + c.replace(/\n$/, "") + "</code></pre>");
  h = h.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  h = h.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  h = h.split(/\n\n+/).map((p) => (/^<(pre|code|ul)/.test(p) ? p : "<p>" + p.replace(/\n/g, "<br>") + "</p>")).join("");
  return h;
}
function money(n: number) {
  return "Rs " + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", text: "Namaste! I'm TallyWeb AI. I can:\n• read VAT bills/receipts from images and post the entry automatically\n• create vouchers from chat (\"I paid Rs 5000 rent today\")\n• answer Nepali accounting questions (VAT 13%, fiscal year, TDS)\n\nAttach a bill photo (📎) or just type below." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetch("/api/ai/key").then((r) => r.json()).then((d) => setHasKey(!!d.has_key)).catch(() => setHasKey(false)); }, []);
  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, open]);

  async function saveKey() {
    setErr("");
    const r = await fetch("/api/ai/key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: keyInput.trim() }) });
    const d = await r.json();
    if (d.ok || d.has_key) { setHasKey(true); setKeyInput(""); }
    else setErr(d.error || "failed");
  }

  async function send(text?: string) {
    const prompt = (text ?? input).trim();
    if (!prompt || busy) return;
    setInput("");
    const next = [...msgs, { role: "user" as const, text: prompt }];
    setMsgs(next);
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/ai/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.text })) }),
      });
      const d = await r.json();
      if (d.error === "no_key") { setHasKey(false); setMsgs([...next, { role: "assistant", text: d.reply }]); }
      else if (d.error) { setErr(d.error); }
      else setMsgs([...next, { role: "assistant", text: d.reply || "(no reply)", voucher: d.voucher }]);
    } catch (e: any) { setErr(String(e)); }
    finally { setBusy(false); }
  }

  async function attachImage(f: File) {
    setBusy(true); setErr("");
    const fd = new FormData();
    fd.append("file", f);
    setMsgs((m) => [...m, { role: "user", text: `📎 attached ${f.name}` }]);
    try {
      const r = await fetch("/api/ai/extract-bill", { method: "POST", body: fd });
      const d = await r.json();
      if (d.error === "no_key") { setHasKey(false); setMsgs((m) => [...m, { role: "assistant", text: "No Grok key set — add it below." }]); }
      else if (d.error) { setErr(d.error); }
      else {
        const b = d.bill;
        const summary = `**Extracted bill**\n• Vendor: ${b.vendor || "?"}\n• Date: ${b.bill_date || "?"}\n• Total: ${money(b.total || 0)}${b.vat_amount ? ` (incl. VAT ${money(b.vat_amount)} @ ${b.vat_rate || 0}%)` : ""}\n• Items: ${(b.items || []).length}`;
        setMsgs((m) => [...m, { role: "assistant", text: summary, bill: b }]);
      }
    } catch (e: any) { setErr(String(e)); }
    finally { setBusy(false); }
  }

  async function createVoucherFromBill(bill: any) {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/ai/apply-voucher", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bill, cash: false }),
      });
      const d = await r.json();
      if (d.error) setErr(d.error);
      else setMsgs((m) => [...m, { role: "assistant", text: `✅ Voucher **${d.voucher_no}** created (${d.voucher_type}, ${money(d.dr)} Dr = ${money(d.cr)} Cr). It's now in the books — see Vouchers.` }]);
    } catch (e: any) { setErr(String(e)); }
    finally { setBusy(false); }
  }

  async function createVoucherFromVoucher(v: any) {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/ai/apply-voucher", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voucher: v }),
      });
      const d = await r.json();
      if (d.error) setErr(d.error);
      else setMsgs((m) => [...m, { role: "assistant", text: `✅ Voucher **${d.voucher_no}** created (${d.voucher_type}). Lines: Dr ${money(d.dr)} = Cr ${money(d.cr)}.` }]);
    } catch (e: any) { setErr(String(e)); }
    finally { setBusy(false); }
  }

  return (
    <>
      {/* floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700 hover:shadow-xl"
          title="AI Assistant"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7">
            <path d={I.bot} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* panel */}
      {open && (
        <div className="fixed bottom-0 right-0 z-50 flex h-[100dvh] w-full flex-col border-l border-slate-200 bg-white shadow-2xl sm:h-[600px] sm:w-[420px] sm:bottom-6 sm:right-6 sm:rounded-xl sm:border dark:border-slate-800 dark:bg-slate-950">
          {/* header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d={I.bot} strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">TallyWeb AI</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Nepali accounting · Grok-powered</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5"><path d={I.close} strokeLinecap="round" /></svg>
            </button>
          </div>

          {/* key setup */}
          {hasKey === false && (
            <div className="border-b border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
              <p className="mb-2 text-xs font-medium text-amber-800 dark:text-amber-300">Set your xAI Grok API key</p>
              <input
                value={keyInput} onChange={(e) => setKeyInput(e.target.value)} type="password"
                placeholder="xai-..." className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm dark:border-amber-800 dark:bg-slate-900"
              />
              <button onClick={saveKey} className="mt-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700">Save key</button>
              <p className="mt-2 text-[10px] text-amber-700 dark:text-amber-400">Get a free key at <span className="underline">console.x.ai</span> — stored locally in data/grok-key.txt</p>
              {err && <p className="mt-1 text-[10px] text-rose-600">{err}</p>}
            </div>
          )}

          {/* messages */}
          <div className="flex-1 overflow-y-auto p-3">
            {msgs.map((m, i) => (
              <div key={i} className={`mb-3 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"}`}>
                  <div className="whitespace-pre-wrap break-words [&_code]:bg-black/10 [&_code]:px-1 [&_code]:rounded [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:bg-slate-900 [&_pre]:p-2 [&_pre]:text-xs [&_pre]:text-emerald-300" dangerouslySetInnerHTML={{ __html: renderMd(m.text) }} />
                  {m.voucher && (
                    <button onClick={() => createVoucherFromVoucher(m.voucher)} disabled={busy}
                      className="mt-2 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800 disabled:opacity-50">
                      ✓ Create voucher
                    </button>
                  )}
                  {m.bill && (
                    <div className="mt-2">
                      <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-2 text-[11px] dark:border-emerald-800 dark:bg-emerald-950/30">
                        <p><b>{m.bill.vendor || "Vendor"}</b> — {money(m.bill.total || 0)}</p>
                        {m.bill.vat_amount > 0 && <p className="text-emerald-700 dark:text-emerald-400">VAT {money(m.bill.vat_amount)} @ {m.bill.vat_rate || 0}%</p>}
                        <p className="text-slate-500">{(m.bill.items || []).length} items · {(m.bill.bill_date || "?")}</p>
                      </div>
                      <button onClick={() => createVoucherFromBill(m.bill)} disabled={busy}
                        className="mt-2 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800 disabled:opacity-50">
                        ✓ Post as voucher (Dr Expense + VAT Receivable, Cr AP)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && <div className="mb-3 flex justify-start"><div className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-400 dark:bg-slate-800">thinking…</div></div>}
            <div ref={endRef} />
          </div>

          {/* input */}
          <div className="border-t border-slate-200 p-2 dark:border-slate-800">
            {err && <p className="mb-1 px-1 text-[10px] text-rose-600">{err}</p>}
            <div className="flex items-end gap-1">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) attachImage(f); e.target.value = ""; }} />
              <button onClick={() => fileRef.current?.click()} disabled={busy || hasKey === false}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800" title="Attach bill image">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5"><path d={I.clip} strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <textarea
                value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Type a message or paste a transaction…" rows={1}
                className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900"
                style={{ maxHeight: 100 }}
              />
              <button onClick={() => send()} disabled={busy || !input.trim() || hasKey === false}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d={I.send} strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
