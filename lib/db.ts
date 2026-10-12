import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "tally.db");
let db: Database.Database | null = null;

export function getDb() {
  if (db) return db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  seed(db);
  return db;
}

function migrate(d: Database.Database) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS ledgers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      group_name TEXT NOT NULL,
      sub_group TEXT,
      opening_balance REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS vouchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_no TEXT NOT NULL UNIQUE,
      voucher_type TEXT NOT NULL,
      date TEXT NOT NULL,
      narration TEXT,
      reference TEXT,
      cost_center_id INTEGER,
      status TEXT NOT NULL DEFAULT 'posted',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS voucher_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_id INTEGER NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
      ledger_id INTEGER NOT NULL REFERENCES ledgers(id),
      amount REAL NOT NULL,
      entry_type TEXT NOT NULL CHECK (entry_type IN ('Dr','Cr'))
    );
    CREATE TABLE IF NOT EXISTS stock_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      unit TEXT NOT NULL DEFAULT 'pcs',
      rate REAL NOT NULL DEFAULT 0,
      quantity REAL NOT NULL DEFAULT 0,
      reorder_level REAL NOT NULL DEFAULT 0,
      hsn TEXT,
      gst_rate REAL NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS parties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      gstin TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      credit_days INTEGER NOT NULL DEFAULT 30,
      credit_limit REAL NOT NULL DEFAULT 0,
      ledger_id INTEGER REFERENCES ledgers(id)
    );
    CREATE TABLE IF NOT EXISTS cost_centers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER REFERENCES cost_centers(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledger_id INTEGER NOT NULL REFERENCES ledgers(id),
      period TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id INTEGER,
      detail TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function seed(d: Database.Database) {
  const count = d.prepare("SELECT COUNT(*) as c FROM ledgers").get() as { c: number };
  if (count.c > 0) {
    seedExtras(d);
    return;
  }

  const insLedger = d.prepare("INSERT INTO ledgers (name, group_name, sub_group, opening_balance) VALUES (?, ?, ?, ?)");
  const ledgers: [string, string, string | null, number][] = [
    ["Cash", "Assets", "Current Assets", 25000],
    ["Bank", "Assets", "Current Assets", 120000],
    ["Accounts Receivable", "Assets", "Current Assets", 0],
    ["Office Equipment", "Assets", "Fixed Assets", 45000],
    ["Accounts Payable", "Liabilities", "Current Liabilities", 0],
    ["GST Payable", "Liabilities", "Duties & Taxes", 0],
    ["Capital", "Equity", "Capital Account", 190000],
    ["Sales", "Income", "Direct Income", 0],
    ["Consulting Income", "Income", "Indirect Income", 0],
    ["Salaries", "Expenses", "Direct Expenses", 0],
    ["Rent", "Expenses", "Indirect Expenses", 0],
    ["Utilities", "Expenses", "Indirect Expenses", 0],
    ["Office Supplies", "Expenses", "Indirect Expenses", 0],
  ];
  const insertMany = d.transaction((rows: [string, string, string | null, number][]) => {
    for (const r of rows) insLedger.run(...r);
  });
  insertMany(ledgers);

  const ledgerId = (name: string) =>
    (d.prepare("SELECT id FROM ledgers WHERE name = ?").get(name) as { id: number }).id;

  const insVoucher = d.prepare("INSERT INTO vouchers (voucher_no, voucher_type, date, narration, reference) VALUES (?, ?, ?, ?, ?)");
  const insEntry = d.prepare("INSERT INTO voucher_entries (voucher_id, ledger_id, amount, entry_type) VALUES (?, ?, ?, ?)");

  const mk = (no: string, type: string, date: string, narration: string, ref: string, lines: [string, number, "Dr" | "Cr"][]) => {
    const v = insVoucher.run(no, type, date, narration, ref);
    const vid = Number(v.lastInsertRowid);
    for (const [name, amt, et] of lines) insEntry.run(vid, ledgerId(name), amt, et);
  };

  mk("SAL-001", "Sales", "2025-10-01", "Invoice to Acme Corp", "INV/2025/001", [["Accounts Receivable", 4200, "Dr"], ["Sales", 4200, "Cr"]]);
  mk("SAL-002", "Sales", "2025-10-03", "Invoice to Globex Inc", "INV/2025/002", [["Accounts Receivable", 1850, "Dr"], ["Sales", 1850, "Cr"]]);
  mk("RCT-001", "Receipt", "2025-10-04", "Payment received Acme", "RCP/2025/001", [["Bank", 4200, "Dr"], ["Accounts Receivable", 4200, "Cr"]]);
  mk("PUR-001", "Purchase", "2025-10-05", "Office chairs purchase", "PO/2025/001", [["Office Equipment", 8000, "Dr"], ["Accounts Payable", 8000, "Cr"]]);
  mk("PAY-001", "Payment", "2025-10-06", "October rent", "PAY/2025/001", [["Rent", 3500, "Dr"], ["Bank", 3500, "Cr"]]);
  mk("JRN-001", "Journal", "2025-10-07", "Salary accrual", "JRN/2025/001", [["Salaries", 12000, "Dr"], ["Accounts Payable", 12000, "Cr"]]);
  mk("SAL-003", "Sales", "2025-10-09", "Invoice to Soylent Co", "INV/2025/003", [["Accounts Receivable", 5400, "Dr"], ["Sales", 5400, "Cr"]]);
  mk("PAY-002", "Payment", "2025-10-10", "Electricity bill", "PAY/2025/002", [["Utilities", 1300, "Dr"], ["Bank", 1300, "Cr"]]);

  const insParty = d.prepare("INSERT INTO parties (name, type, gstin, phone, email, address, credit_days, credit_limit, ledger_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  insParty.run("Acme Corp", "Customer", "27AABCA1234F1Z5", "+1-555-0101", "billing@acme.com", "123 Industrial Way", 30, 100000, ledgerId("Accounts Receivable"));
  insParty.run("Globex Inc", "Customer", "27AABCB5678F1Z2", "+1-555-0102", "ap@globex.com", "45 Commerce Park", 45, 50000, ledgerId("Accounts Receivable"));
  insParty.run("Soylent Co", "Customer", "27AABCC9012F1Z9", "+1-555-0103", "accounts@soylent.com", "9 Green Rd", 15, 75000, ledgerId("Accounts Receivable"));
  insParty.run("OfficeMart", "Supplier", "27AABCD3456F1Z1", "+1-555-0201", "sales@officemart.com", "77 Supply St", 30, 200000, ledgerId("Accounts Payable"));

  const insStock = d.prepare("INSERT INTO stock_items (name, unit, rate, quantity, reorder_level, hsn, gst_rate) VALUES (?, ?, ?, ?, ?, ?, ?)");
  insStock.run("Ergonomic Chair", "pcs", 8000, 12, 5, "9401", 18);
  insStock.run("Standing Desk", "pcs", 22000, 5, 3, "9403", 18);
  insStock.run("Laptop Stand", "pcs", 1500, 30, 10, "8473", 18);
  insStock.run("A4 Paper Ream", "ream", 320, 120, 50, "4802", 12);

  seedExtras(d);
}

function seedExtras(d: Database.Database) {
  const cc = d.prepare("SELECT COUNT(*) as c FROM cost_centers").get() as { c: number };
  if (cc.c === 0) {
    d.prepare("INSERT INTO cost_centers (name) VALUES (?)").run("Head Office");
    d.prepare("INSERT INTO cost_centers (name) VALUES (?)").run("Sales Division");
    d.prepare("INSERT INTO cost_centers (name) VALUES (?)").run("R&D");
  }
  const b = d.prepare("SELECT COUNT(*) as c FROM budgets").get() as { c: number };
  if (b.c === 0) {
    const lid = (n: string) => (d.prepare("SELECT id FROM ledgers WHERE name = ?").get(n) as { id: number } | undefined)?.id;
    const rent = lid("Rent"), sal = lid("Salaries"), util = lid("Utilities"), sales = lid("Sales");
    const ins = d.prepare("INSERT INTO budgets (ledger_id, period, amount) VALUES (?, ?, ?)");
    if (sales) ins.run(sales, "2025-10", 20000);
    if (rent) ins.run(rent, "2025-10", 4000);
    if (sal) ins.run(sal, "2025-10", 15000);
    if (util) ins.run(util, "2025-10", 2000);
  }
}

export function logAudit(action: string, entity: string, entityId: number | null, detail: string) {
  try {
    getDb().prepare("INSERT INTO audit_log (action, entity, entity_id, detail) VALUES (?, ?, ?, ?)").run(action, entity, entityId, detail);
  } catch {}
}