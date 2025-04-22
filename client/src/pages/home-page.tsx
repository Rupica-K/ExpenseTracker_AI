import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppShell from "@/components/layout/app-shell";
import BalanceCard from "@/components/balance-card";
import AITipsCard from "@/components/ai-tips-card";
import TransactionItem from "@/components/transaction-item";
import ExpenseForm from "@/components/expense-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2 } from "lucide-react";
import { Transaction, Insight } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState("all");
  
  // Fetch dashboard data
  const { data: dashboard, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["/api/dashboard"],
    staleTime: 60000, // 1 minute
  });
  
  // Fetch transactions
  const { data: transactions, isLoading: isTransactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    staleTime: 60000, // 1 minute
  });
  
  // Fetch insights
  const { data: insights, isLoading: isInsightsLoading } = useQuery<Insight[]>({
    queryKey: ["/api/insights"],
    staleTime: 300000, // 5 minutes
  });
  
  const filteredTransactions = () => {
    if (!transactions) return [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - today.getDay());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    switch (timeFilter) {
      case 'today':
        return transactions.filter(t => new Date(t.date) >= today);
      case 'week':
        return transactions.filter(t => new Date(t.date) >= thisWeek);
      case 'month':
        return transactions.filter(t => new Date(t.date) >= thisMonth);
      default:
        return transactions;
    }
  };

  return (
    <AppShell activeTab="dashboard">
      <div className="space-y-6">
        {/* Balance Card */}
        {isDashboardLoading ? (
          <Skeleton className="h-48 w-full rounded-2xl" />
        ) : (
          <BalanceCard 
            balance={dashboard?.balance ?? 0} 
            income={dashboard?.income ?? 0} 
            expenses={dashboard?.expenses ?? 0} 
          />
        )}
        
        {/* AI Tips Card */}
        {isInsightsLoading ? (
          <Skeleton className="h-20 w-full rounded-xl" />
        ) : (
          <AITipsCard insights={insights || []} isLoading={isInsightsLoading} />
        )}
        
        {/* Time Filters */}
        <Tabs defaultValue={timeFilter} onValueChange={setTimeFilter} className="w-full">
          <TabsList className="grid grid-cols-4 w-full mb-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Transactions List */}
        <Card>
          <CardHeader className="px-4 py-3 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-96 overflow-y-auto">
            {isTransactionsLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="p-4 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
              ))
            ) : filteredTransactions().length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">No transactions yet</h3>
                <p className="mt-2 text-sm text-gray-500">Add your first transaction by clicking the + button</p>
              </div>
            ) : (
              filteredTransactions().map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))
            )}
          </CardContent>
        </Card>
        
        {/* Floating Action Button */}
        <Button 
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
          size="icon"
          onClick={() => setIsExpenseFormOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
        
        {/* Expense Form Dialog */}
        <ExpenseForm 
          open={isExpenseFormOpen} 
          onOpenChange={setIsExpenseFormOpen} 
        />
      </div>
    </AppShell>
  );
}
