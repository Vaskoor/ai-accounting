const transactions = [
  { id: "INV-001", client: "Acme Corp", date: "2025-10-01", amount: 4200, status: "Paid" },
  { id: "INV-002", client: "Globex Inc", date: "2025-10-03", amount: 1850, status: "Pending" },
  { id: "INV-003", client: "Initech", date: "2025-10-05", amount: 3200, status: "Paid" },
  { id: "INV-004", client: "Umbrella LLC", date: "2025-10-07", amount: 950, status: "Overdue" },
  { id: "INV-005", client: "Soylent Co", date: "2025-10-09", amount: 5400, status: "Paid" },
  { id: "INV-006", client: "Hooli", date: "2025-10-11", amount: 2100, status: "Pending" },
];

const monthly = [
  { month: "May", income: 8200, expense: 4100 },
  { month: "Jun", income: 9100, expense: 4600 },
  { month: "Jul", income: 7800, expense: 3900 },
  { month: "Aug", income: 10300, expense: 5200 },
  { month: "Sep", income: 11500, expense: 4800 },
  { month: "Oct", income: 9600, expense: 4300 },
];

const totalIncome = transactions
  .filter((t) => t.status === "Paid")
  .reduce((s, t) => s + t.amount, 0);
const pending = transactions
  .filter((t) => t.status === "Pending")
  .reduce((s, t) => s + t.amount, 0);
const overdue = transactions
  .filter((t) => t.status === "Overdue")
  .reduce((s, t) => s + t.amount, 0);
const maxBar = Math.max(...monthly.map((m) => Math.max(m.income, m.expense)));

const cards = [
  { label: "Total Income", value: totalIncome, tone: "emerald", icon: "$" },
  { label: "Pending", value: pending, tone: "amber", icon: "~" },
  { label: "Overdue", value: overdue, tone: "rose", icon: "!" },
  { label: "Net (after est. tax)", value: Math.round(totalIncome * 0.7), tone: "sky", icon: "=" },
];

const toneMap: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  sky: "bg-sky-50 text-sky-700 border-sky-200",
};

const statusMap: Record<string, string> = {
  Paid: "bg-emerald-100 text-emerald-700",
  Pending: "bg-amber-100 text-amber-700",
  Overdue: "bg-rose-100 text-rose-700",
};

function money(n: number) {
  return "$" + n.toLocaleString("en-US");
}

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Accounting Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">October 2025 &middot; Overview</p>
          </div>
          <button className="rounded-lg bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-700 transition">
            + New Invoice
          </button>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((c) => (
            <div
              key={c.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {c.label}
                </span>
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full border text-sm ${toneMap[c.tone]}`}
                >
                  {c.icon}
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{money(c.value)}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold text-slate-700">Income vs Expense</h2>
              <div className="flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />Income
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-rose-400" />Expense
                </span>
              </div>
            </div>
            <div className="flex items-end justify-between gap-3 h-48">
              {monthly.map((m) => (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-2 h-full">
                  <div className="flex items-end justify-center gap-1 w-full h-full">
                    <div
                      className="w-1/2 rounded-t bg-emerald-500"
                      style={{ height: `${(m.income / maxBar) * 100}%` }}
                      title={money(m.income)}
                    />
                    <div
                      className="w-1/2 rounded-t bg-rose-400"
                      style={{ height: `${(m.expense / maxBar) * 100}%` }}
                      title={money(m.expense)}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{m.month}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
            <h2 className="text-sm font-semibold text-slate-700 mb-6">Monthly Budget</h2>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative h-32 w-32">
                <div className="absolute inset-0 rounded-full border-8 border-slate-100" />
                <div
                  className="absolute inset-0 rounded-full border-8 border-transparent"
                  style={{
                    borderTopColor: "#10b981",
                    borderRightColor: "#10b981",
                    transform: "rotate(135deg)",
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-semibold text-slate-900">68%</span>
                  <span className="text-xs text-slate-500">used</span>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">$6,800 / $10,000</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-6 pb-4">
            <h2 className="text-sm font-semibold text-slate-700">Recent Transactions</h2>
            <button className="text-xs text-slate-500 hover:text-slate-900">
              View all &rarr;
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3 font-medium">Invoice</th>
                  <th className="px-6 py-3 font-medium">Client</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium text-right">Amount</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-mono text-xs text-slate-500">{t.id}</td>
                    <td className="px-6 py-3 font-medium text-slate-800">{t.client}</td>
                    <td className="px-6 py-3 text-slate-500">{t.date}</td>
                    <td className="px-6 py-3 text-right font-semibold text-slate-900">
                      {money(t.amount)}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusMap[t.status]}`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="mt-8 text-center text-xs text-slate-400">
          Built with Next.js &middot; for college studies
        </footer>
      </div>
    </main>
  );
}
