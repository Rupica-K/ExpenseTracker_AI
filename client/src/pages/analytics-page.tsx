import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";
import AppShell from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryById } from "@/lib/categories";
import { formatCurrency } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsPage() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth()
  });
  
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/month", selectedMonth.year, selectedMonth.month],
  });
  
  const chartColors = [
    "#6366f1", // primary
    "#8b5cf6", // secondary
    "#ec4899", // accent
    "#10b981", // success
    "#f59e0b", // warning
    "#ef4444", // danger
    "#4b5563", // gray
    "#8b5cf6", // indigo
    "#06b6d4", // cyan
    "#14b8a6", // teal
    "#f43f5e", // rose
    "#0ea5e9"  // sky
  ];
  
  const getCategoryData = () => {
    if (!transactions) return [];
    
    const categoryMap = new Map<string, number>();
    
    // Only calculate expenses, not income
    transactions
      .filter(t => !t.isIncome)
      .forEach(t => {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + t.amount);
      });
    
    return Array.from(categoryMap.entries())
      .map(([category, amount]) => {
        try {
          const categoryInfo = getCategoryById(category);
          return {
            name: categoryInfo.name,
            value: amount,
            id: category
          };
        } catch (e) {
          console.error(`Invalid category: ${category}`);
          return {
            name: "Other",
            value: amount,
            id: "other"
          };
        }
      })
      .sort((a, b) => b.value - a.value);
  };
  
  const categoryData = getCategoryData();
  
  const prevMonth = () => {
    setSelectedMonth(prev => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };
  
  const nextMonth = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Don't allow navigation to future months
    if (selectedMonth.year === currentYear && selectedMonth.month === currentMonth) {
      return;
    }
    
    setSelectedMonth(prev => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };
  
  return (
    <AppShell activeTab="analytics">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Monthly Spending</CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={prevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {format(new Date(selectedMonth.year, selectedMonth.month), 'MMMM yyyy')}
            </span>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={nextMonth}
              disabled={
                selectedMonth.year === currentDate.getFullYear() && 
                selectedMonth.month === currentDate.getMonth()
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row">
            {/* Chart Section */}
            <div className="w-full md:w-1/2 h-80 flex items-center justify-center">
              {isLoading ? (
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              ) : categoryData.length === 0 ? (
                <div className="text-center p-6">
                  <h3 className="text-lg font-medium">No expenses this month</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add some expenses to see your spending breakdown
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      innerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), "Amount"]} 
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            
            {/* Category Breakdown List */}
            <div className="w-full md:w-1/2 md:pl-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">Category Breakdown</h3>
              <div className="space-y-3">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Skeleton className="h-8 w-8 rounded-full mr-3" />
                        <div>
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-2 w-full mt-1" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))
                ) : categoryData.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      No category data available
                    </p>
                  </div>
                ) : (
                  categoryData.map((category, index) => {
                    const categoryInfo = getCategoryById(category.id);
                    const Icon = categoryInfo.icon;
                    const percentage = Math.round(
                      (category.value / categoryData.reduce((sum, item) => sum + item.value, 0)) * 100
                    );
                    
                    return (
                      <div key={category.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`h-8 w-8 rounded-full ${categoryInfo.bgColor} flex items-center justify-center ${categoryInfo.color} mr-3`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{category.name}</p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div 
                                className="h-1.5 rounded-full" 
                                style={{ 
                                  width: `${percentage}%`,
                                  backgroundColor: chartColors[index % chartColors.length]
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <span className="font-medium text-gray-900">{formatCurrency(category.value)}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
