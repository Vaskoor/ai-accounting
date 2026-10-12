# TallyWeb — Advanced Accounting App

A Tally-style double-entry accounting web app built with Next.js 14 (App Router),
TypeScript, Tailwind CSS, and SQLite (better-sqlite3).

## Features

### Core
- **Dashboard** — live KPI cards (income, expenses, net profit, stock value),
  income-vs-expense chart, account balances, recent vouchers
- **Vouchers** — balanced double-entry vouchers (Sales, Purchase, Receipt,
  Payment, Journal, Contra) with real-time Dr/Cr validation, references, cost centers
- **Ledgers** — chart of accounts grouped by Assets / Liabilities / Equity /
  Income / Expenses with sub-groups and opening balances
- **Parties** — customers & suppliers with GSTIN, credit days, credit limits
- **Stock** — inventory with HSN, GST rate, quantity, reorder level, valuation

### Advanced
- **Ledger Statement** — full account statement with running balance (Tally-style)
- **Reports** — Trial Balance, Profit & Loss, Balance Sheet, **Cash Flow**,
  **Financial Ratios**, Day Book
- **Budgets** — set budgets per ledger/period, track actual vs budget with variance
- **Cost Centers** — departmental cost allocation
- **Aging** — receivables/payables aging buckets (0-30, 31-60, 61-90, 90+)
- **GST** — output tax, input tax, net payable, items grouped by GST rate
- **Audit Log** — tracks create/update actions across the app

## Accounting model

- Double-entry: every voucher must have debits == credits
- Ledger groups classified by normal balance side:
  - Debit-natured: Assets, Expenses
  - Credit-natured: Liabilities, Equity, Income
- Reports compute signed balances so Trial Balance and Balance Sheet always balance

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 (or the port shown). The SQLite database is created
and seeded automatically at `data/tally.db` on first run.

## Tech stack

- Next.js 14 (App Router) + React 18
- TypeScript
- Tailwind CSS
- better-sqlite3 (synchronous SQLite)

## API

| Endpoint | Methods | Purpose |
|---|---|---|
| `/api/dashboard` | GET | KPI summary |
| `/api/ledgers` | GET, POST | Chart of accounts |
| `/api/vouchers` | GET, POST | Double-entry vouchers |
| `/api/parties` | GET, POST | Customers / suppliers |
| `/api/stock` | GET, POST | Inventory |
| `/api/cost-centers` | GET, POST | Cost centers |
| `/api/budgets` | GET, POST | Budgets vs actual |
| `/api/aging` | GET | Receivables/payables aging |
| `/api/gst` | GET | GST summary |
| `/api/audit` | GET | Audit trail |
| `/api/ledger-statement` | GET | Account statement |
| `/api/reports` | GET | Trial Balance, P&L, Balance Sheet, Cash Flow, Ratios, Day Book |