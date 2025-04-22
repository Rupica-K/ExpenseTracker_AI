import { Transaction } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { getCategoryById } from "@/lib/categories";

interface TransactionItemProps {
  transaction: Transaction;
}

export default function TransactionItem({ transaction }: TransactionItemProps) {
  const { amount, category, description, date, isIncome } = transaction;
  const categoryInfo = getCategoryById(category);
  const Icon = categoryInfo.icon;
  
  return (
    <div className="py-3 flex items-center justify-between border-b border-gray-100 last:border-0">
      <div className="flex items-center">
        <div className={`h-10 w-10 rounded-full ${categoryInfo.bgColor} flex items-center justify-center ${categoryInfo.color} mr-3`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{description || categoryInfo.name}</p>
          <p className="text-xs text-gray-500">{format(new Date(date), 'MMM d, yyyy')}</p>
        </div>
      </div>
      <span className={`font-medium ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
        {isIncome ? '+' : '-'}{formatCurrency(amount)}
      </span>
    </div>
  );
}
