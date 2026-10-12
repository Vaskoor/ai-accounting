// Accounting helpers: classify ledgers by normal balance side.
// Debit-natured: Assets, Expenses  -> positive stored balance = debit
// Credit-natured: Liabilities, Equity, Income -> positive stored balance = credit
export const CREDIT_GROUPS = ["Liabilities", "Equity", "Income"];

export function isCreditGroup(group: string): boolean {
  return CREDIT_GROUPS.includes(group);
}

// Convert a stored "natural positive" opening balance into signed value
// where positive = debit, negative = credit.
export function signedOpening(opening: number, group: string): number {
  return isCreditGroup(group) ? -opening : opening;
}