import { formatCurrency } from "@/lib/utils";

interface BalanceCardProps {
  balance: number;
  income: number;
  expenses: number;
}

export default function BalanceCard({ balance, income, expenses }: BalanceCardProps) {
  return (
    <div className="bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-2xl text-white shadow-lg p-6">
      <div className="text-center mb-6">
        <p className="text-white/80 text-sm font-medium uppercase tracking-wide">Total Balance</p>
        <h1 className="text-4xl font-bold mt-1">{formatCurrency(balance)}</h1>
      </div>
      <div className="flex justify-between pt-4 border-t border-white/20">
        <div>
          <p className="text-white/80 text-xs uppercase tracking-wide">Income</p>
          <p className="text-xl font-medium mt-1">{formatCurrency(income)}</p>
        </div>
        <div className="text-right">
          <p className="text-white/80 text-xs uppercase tracking-wide">Expenses</p>
          <p className="text-xl font-medium mt-1">{formatCurrency(expenses)}</p>
        </div>
      </div>
    </div>
  );
}
