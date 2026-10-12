# TallyWeb — Accounting App

A Tally-style double-entry accounting web app built with Next.js 14 (App Router),
TypeScript, Tailwind CSS, and SQLite (better-sqlite3).

## Features

- **Dashboard** — live KPI cards (income, expenses, net profit, stock value),
  income-vs-expense chart, account balances, recent vouchers
- **Vouchers** — create balanced double-entry vouchers (Sales, Purchase, Receipt,
  Payment, Journal, Contra) with real-time Dr/Cr balance validation
- **Ledgers** — chart of accounts grouped by Assets / Liabilities / Equity /
  Income / Expenses, with opening balances
- **Parties** — customers & suppliers with GSTIN, contact details
- **Stock** — inventory items with HSN, GST rate, quantity, and valuation
- **Reports** — Trial Balance, Profit & Loss, Balance Sheet, Day Book

## Accounting model

- Double-entry: every voucher must have debits == credits
- Ledger groups are classified by normal balance side:
  - Debit-natured: Assets, Expenses
  - Credit-natured: Liabilities, Equity, Income
- Reports compute signed balances so the Trial Balance and Balance Sheet balance

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