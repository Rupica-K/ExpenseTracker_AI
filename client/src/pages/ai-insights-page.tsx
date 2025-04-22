import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import AppShell from "@/components/layout/app-shell";
import { getQueryFn } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { 
  Calendar,
  TrendingUp,
  PieChart as PieChartIcon,
  Target,
  Bell,
  Activity,
  Lightbulb,
  Clock,
  DollarSign,
  Calendar as CalendarIcon,
  AlertCircle,
  ChevronRight,
  PiggyBank,
  Flame,
  Scissors
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCategoryById } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface SpendingForecast {
  nextMonth: {
    totalExpense: number;
    categoryBreakdown: {
      [category: string]: number;
    };
  };
  confidence: number;
}

interface BudgetSuggestion {
  category: string;
  currentSpending: number;
  suggestedBudget: number;
  reasoning: string;
}

interface SavingsGoalCategoryCut {
  category: string;
  currentSpending: number;
  suggestedReduction: number;
  monthlySavings: number;
}

interface SavingsGoal {
  targetAmount: number;
  timeframeMonths: number;
  categoryCuts: SavingsGoalCategoryCut[];
  reasoning: string;
}

interface BillReminder {
  description: string;
  estimatedAmount: number;
  dueDate: string;
  confidence: number;
}

interface SpendingPattern {
  pattern: string;
  impact: number;
  suggestion: string;
}

interface AIInsights {
  spendingForecast?: SpendingForecast;
  budgetSuggestions?: BudgetSuggestion[];
  savingsGoals?: SavingsGoal[];
  billReminders?: BillReminder[];
  spendingPatterns?: SpendingPattern[];
  message?: string;
}

// Helper to format date in readable format
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Helper to determine color based on confidence
function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.7) return "text-green-500";
  if (confidence >= 0.4) return "text-amber-500";
  return "text-red-500";
}

// Helper to calculate days until date
function getDaysUntil(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export default function AIInsightsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  
  // Fetch all AI insights
  const { 
    data: insights, 
    isLoading, 
    isError, 
    error 
  } = useQuery<AIInsights>({
    queryKey: ["/api/ai-insights"],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchOnWindowFocus: false,
    retry: 1,
  });
  
  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading AI insights",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);
  
  // Transform the spending forecast data for charts
  const forecastChartData = insights?.spendingForecast?.nextMonth.categoryBreakdown ? 
    Object.entries(insights.spendingForecast.nextMonth.categoryBreakdown).map(([category, amount]) => {
      const categoryInfo = getCategoryById(category);
      return {
        name: categoryInfo.name,
        amount: amount,
        fill: categoryInfo.color
      };
    }) : [];
  
  // Transform budget suggestions for chart
  const budgetComparisonData = insights?.budgetSuggestions?.map(suggestion => {
    const categoryInfo = getCategoryById(suggestion.category);
    return {
      name: categoryInfo.name,
      current: suggestion.currentSpending,
      suggested: suggestion.suggestedBudget,
    };
  }) || [];
  
  // COLORS for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  return (
    <AppShell activeTab="ai-insights">
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-2">AI Financial Insights</h1>
        <p className="text-muted-foreground mb-6">
          Get personalized recommendations and insights powered by AI to optimize your finances.
        </p>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-6 mb-6">
            <TabsTrigger value="all">
              <Lightbulb className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">All Insights</span>
            </TabsTrigger>
            <TabsTrigger value="forecast">
              <TrendingUp className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Forecast</span>
            </TabsTrigger>
            <TabsTrigger value="budget">
              <PieChartIcon className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Budget</span>
            </TabsTrigger>
            <TabsTrigger value="goals">
              <Target className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Goals</span>
            </TabsTrigger>
            <TabsTrigger value="bills">
              <Bell className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Bills</span>
            </TabsTrigger>
            <TabsTrigger value="patterns">
              <Activity className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Patterns</span>
            </TabsTrigger>
          </TabsList>
          
          {isLoading ? (
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <Skeleton className="h-8 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                  <div className="mt-6 h-64">
                    <Skeleton className="h-full w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : insights?.message ? (
            <Card>
              <CardHeader>
                <CardTitle>Not Enough Data</CardTitle>
                <CardDescription>
                  We need more transaction data to generate AI insights.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="flex justify-center">
                    <AlertCircle className="h-16 w-16 text-orange-500 mb-4" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">
                    {insights.message}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Add at least 5-10 transactions to receive personalized AI insights and recommendations.
                  </p>
                  <Button>
                    Add Transactions
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <TabsContent value="all" className="space-y-6">
                {/* Spending Forecast Preview */}
                {insights?.spendingForecast && (
                  <Card className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center">
                            <TrendingUp className="mr-2 h-5 w-5 text-blue-500" />
                            Next Month Spending Forecast
                          </CardTitle>
                          <CardDescription>
                            Predicted expenses for next month based on your spending patterns
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className={getConfidenceColor(insights.spendingForecast.confidence)}>
                          {Math.round(insights.spendingForecast.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2">
                            Expected Total: {formatCurrency(insights.spendingForecast.nextMonth.totalExpense)}
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            Based on your recent spending habits and transaction patterns
                          </p>
                          <div className="mt-4">
                            <Button 
                              variant="outline" 
                              className="w-full lg:w-auto"
                              onClick={() => setActiveTab("forecast")}
                            >
                              View Detailed Forecast
                              <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="h-64 flex-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={forecastChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="amount"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {forecastChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Budget Suggestions Preview */}
                {insights?.budgetSuggestions && insights.budgetSuggestions.length > 0 && (
                  <Card className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 pb-2">
                      <CardTitle className="flex items-center">
                        <PieChartIcon className="mr-2 h-5 w-5 text-green-500" />
                        Smart Budget Suggestions
                      </CardTitle>
                      <CardDescription>
                        Personalized budget recommendations to optimize your spending
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                          <div className="space-y-4">
                            {insights.budgetSuggestions.slice(0, 2).map((suggestion, index) => {
                              const categoryInfo = getCategoryById(suggestion.category);
                              return (
                                <div key={index} className="flex flex-col">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center">
                                      <categoryInfo.icon className={`mr-2 h-4 w-4 ${categoryInfo.color}`} />
                                      <span className="font-medium">{categoryInfo.name}</span>
                                    </div>
                                    <div className="text-sm">
                                      <span className="text-red-500 line-through mr-2">
                                        {formatCurrency(suggestion.currentSpending)}
                                      </span>
                                      <span className="text-green-500 font-medium">
                                        {formatCurrency(suggestion.suggestedBudget)}
                                      </span>
                                    </div>
                                  </div>
                                  <Progress 
                                    value={(suggestion.suggestedBudget / suggestion.currentSpending) * 100} 
                                    className="h-2" 
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">{suggestion.reasoning}</p>
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="mt-6">
                            <Button 
                              variant="outline" 
                              className="w-full lg:w-auto"
                              onClick={() => setActiveTab("budget")}
                            >
                              View All Budget Suggestions
                              <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="h-64 flex-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={budgetComparisonData.slice(0, 3)}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis tickFormatter={(value) => `₹${value}`} />
                              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                              <Legend />
                              <Bar name="Current Spending" dataKey="current" fill="#ef4444" />
                              <Bar name="Suggested Budget" dataKey="suggested" fill="#22c55e" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Savings Goals Preview */}
                {insights?.savingsGoals && insights.savingsGoals.length > 0 && (
                  <Card className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 pb-2">
                      <CardTitle className="flex items-center">
                        <Target className="mr-2 h-5 w-5 text-purple-500" />
                        Savings Goal Plan
                      </CardTitle>
                      <CardDescription>
                        How to reach your savings target by optimizing expenses
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                          <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-lg font-semibold">Target: {formatCurrency(insights.savingsGoals[0].targetAmount)}</h3>
                                <p className="text-muted-foreground text-sm">
                                  Achievable in {insights.savingsGoals[0].timeframeMonths} months
                                </p>
                              </div>
                              <PiggyBank className="h-8 w-8 text-purple-500" />
                            </div>
                            <p className="text-sm mb-3">
                              {insights.savingsGoals[0].reasoning}
                            </p>
                            <div className="flex justify-between text-sm">
                              <span>Monthly saving: {formatCurrency(insights.savingsGoals[0].targetAmount / insights.savingsGoals[0].timeframeMonths)}</span>
                              <Badge variant="outline" className="bg-purple-500/10">
                                <CalendarIcon className="mr-1 h-3 w-3" /> {insights.savingsGoals[0].timeframeMonths} months
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="mt-6">
                            <Button 
                              variant="outline" 
                              className="w-full lg:w-auto"
                              onClick={() => setActiveTab("goals")}
                            >
                              View Detailed Savings Plan
                              <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex-1 p-3 border rounded-lg">
                          <h3 className="text-sm font-medium mb-3">Suggested Category Cuts</h3>
                          <div className="space-y-4">
                            {insights.savingsGoals[0].categoryCuts.slice(0, 3).map((cut, idx) => {
                              const categoryInfo = getCategoryById(cut.category);
                              const percentReduction = Math.round((cut.suggestedReduction / cut.currentSpending) * 100);
                              
                              return (
                                <div key={idx} className="flex items-center justify-between border-b pb-2">
                                  <div className="flex items-center">
                                    <categoryInfo.icon className={`mr-2 h-4 w-4 ${categoryInfo.color}`} />
                                    <div>
                                      <p className="font-medium">{categoryInfo.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        Cut {formatCurrency(cut.suggestedReduction)} ({percentReduction}%)
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    <Scissors className="h-3 w-3 mr-1 text-muted-foreground" />
                                    <span className="font-medium text-green-500">
                                      {formatCurrency(cut.monthlySavings)}/mo
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Bill Reminders Preview */}
                {insights?.billReminders && insights.billReminders.length > 0 && (
                  <Card className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 pb-2">
                      <CardTitle className="flex items-center">
                        <Bell className="mr-2 h-5 w-5 text-amber-500" />
                        Upcoming Bill Reminders
                      </CardTitle>
                      <CardDescription>
                        Predicted bills and subscriptions based on your spending patterns
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {insights.billReminders.slice(0, 4).map((bill, index) => {
                          const daysUntil = getDaysUntil(bill.dueDate);
                          const isUrgent = daysUntil <= 3;
                          const isSoon = daysUntil <= 7;
                          
                          return (
                            <div 
                              key={index} 
                              className={`p-4 border rounded-lg flex items-start space-x-4
                                ${isUrgent ? 'border-red-300 bg-red-50' : 
                                  isSoon ? 'border-amber-300 bg-amber-50' : 'bg-muted/40'}`}
                            >
                              <div className={`p-2 rounded-full 
                                ${isUrgent ? 'bg-red-100' : 
                                  isSoon ? 'bg-amber-100' : 'bg-muted'}`}>
                                <Clock className={`h-5 w-5 
                                  ${isUrgent ? 'text-red-500' : 
                                    isSoon ? 'text-amber-500' : 'text-muted-foreground'}`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <h4 className="font-medium">{bill.description}</h4>
                                  <Badge variant="outline" className={getConfidenceColor(bill.confidence)}>
                                    {Math.round(bill.confidence * 100)}%
                                  </Badge>
                                </div>
                                <p className="text-sm">{formatCurrency(bill.estimatedAmount)}</p>
                                <div className="flex justify-between items-center mt-2">
                                  <span className="text-xs text-muted-foreground">
                                    Due {formatDate(bill.dueDate)}
                                  </span>
                                  <Badge 
                                    variant={isUrgent ? "destructive" : isSoon ? "default" : "outline"}
                                    className={!isUrgent && !isSoon ? "bg-muted" : ""}
                                  >
                                    {daysUntil <= 0 ? 'Due today' : 
                                      daysUntil === 1 ? 'Due tomorrow' : 
                                        `Due in ${daysUntil} days`}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="mt-2">
                        <Button 
                          variant="outline" 
                          className="w-full lg:w-auto"
                          onClick={() => setActiveTab("bills")}
                        >
                          View All Bill Reminders
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Spending Patterns Preview */}
                {insights?.spendingPatterns && insights.spendingPatterns.length > 0 && (
                  <Card className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10 pb-2">
                      <CardTitle className="flex items-center">
                        <Activity className="mr-2 h-5 w-5 text-orange-500" />
                        Spending Pattern Analysis
                      </CardTitle>
                      <CardDescription>
                        Behavioral insights to help you optimize your spending habits
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4 mb-6">
                        {insights.spendingPatterns.slice(0, 2).map((pattern, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex space-x-3">
                                <div className="bg-orange-100 p-2 rounded-full">
                                  <Flame className="h-5 w-5 text-orange-500" />
                                </div>
                                <div>
                                  <h4 className="font-medium">{pattern.pattern}</h4>
                                  <p className="text-xs text-muted-foreground">
                                    Affects approximately {Math.round(pattern.impact)}% of your expenses
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline" className="bg-muted">
                                {Math.round(pattern.impact)}% impact
                              </Badge>
                            </div>
                            <div className="ml-10 mt-3 text-sm">
                              <p><span className="font-medium">Suggestion:</span> {pattern.suggestion}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-2">
                        <Button 
                          variant="outline" 
                          className="w-full lg:w-auto"
                          onClick={() => setActiveTab("patterns")}
                        >
                          View All Spending Patterns
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              {/* Detailed Forecast Tab */}
              <TabsContent value="forecast">
                {insights?.spendingForecast ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <TrendingUp className="mr-2 h-5 w-5 text-blue-500" />
                        Next Month Spending Forecast
                      </CardTitle>
                      <CardDescription>
                        Detailed breakdown of predicted expenses for next month
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-2xl font-bold">
                            {formatCurrency(insights.spendingForecast.nextMonth.totalExpense)}
                          </h3>
                          <Badge variant="outline" className={getConfidenceColor(insights.spendingForecast.confidence)}>
                            {Math.round(insights.spendingForecast.confidence * 100)}% confidence
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">
                          This is your predicted total expense for next month based on your spending patterns
                        </p>
                      </div>
                      
                      <div className="h-80 mb-8">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={forecastChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              outerRadius={130}
                              fill="#8884d8"
                              dataKey="amount"
                              label={({ name, value, percent }) => 
                                `${name}: ${formatCurrency(value)} (${(percent * 100).toFixed(0)}%)`}
                            >
                              {forecastChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-4">Category Breakdown</h3>
                      <div className="divide-y">
                        {forecastChartData.map((category, idx) => {
                          const categoryInfo = getCategoryById(category.name);
                          const percentage = (category.amount / insights.spendingForecast!.nextMonth.totalExpense) * 100;
                          
                          return (
                            <div key={idx} className="py-3 flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="p-2 rounded-full mr-3" style={{ backgroundColor: COLORS[idx % COLORS.length] + '20' }}>
                                  <categoryInfo.icon className="h-5 w-5" style={{ color: COLORS[idx % COLORS.length] }} />
                                </div>
                                <div>
                                  <p className="font-medium">{category.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {percentage.toFixed(1)}% of total
                                  </p>
                                </div>
                              </div>
                              <span className="font-medium">
                                {formatCurrency(category.amount)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Forecast Insights</h4>
                            <p className="text-sm">
                              This forecast is based on your recent transaction history. Add more transactions to improve accuracy. The model looks for patterns in your spending by category and predicts future expenses accordingly.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>No Forecast Available</CardTitle>
                      <CardDescription>
                        We need more transaction data to create a spending forecast.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                        <p className="text-lg mb-6">
                          Add more transactions to receive AI-powered spending forecasts.
                        </p>
                        <Button>Add Transactions</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              {/* Budget Suggestions Tab */}
              <TabsContent value="budget">
                {insights?.budgetSuggestions && insights.budgetSuggestions.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <PieChartIcon className="mr-2 h-5 w-5 text-green-500" />
                        Smart Budget Suggestions
                      </CardTitle>
                      <CardDescription>
                        Personalized budget recommendations based on your spending habits
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80 mb-8">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={budgetComparisonData}
                            margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => `₹${value}`} />
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                            <Legend />
                            <Bar name="Current Spending" dataKey="current" fill="#ef4444" />
                            <Bar name="Suggested Budget" dataKey="suggested" fill="#22c55e" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="space-y-6 mt-6">
                        {insights.budgetSuggestions.map((suggestion, index) => {
                          const categoryInfo = getCategoryById(suggestion.category);
                          const savingsAmount = suggestion.currentSpending - suggestion.suggestedBudget;
                          const savingsPercent = Math.round((savingsAmount / suggestion.currentSpending) * 100);
                          
                          return (
                            <div key={index} className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center">
                                  <div className={`p-2 rounded-full mr-3 ${categoryInfo.bgColor}`}>
                                    <categoryInfo.icon className={`h-5 w-5 ${categoryInfo.color}`} />
                                  </div>
                                  <h3 className="font-semibold text-lg">{categoryInfo.name}</h3>
                                </div>
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                                  Save {savingsPercent}%
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                                  <p className="text-xs text-muted-foreground mb-1">Current Monthly Spending</p>
                                  <p className="text-xl font-bold text-red-600">
                                    {formatCurrency(suggestion.currentSpending)}
                                  </p>
                                </div>
                                <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                                  <p className="text-xs text-muted-foreground mb-1">Suggested Budget</p>
                                  <p className="text-xl font-bold text-green-600">
                                    {formatCurrency(suggestion.suggestedBudget)}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="mb-3">
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Potential Monthly Savings</span>
                                  <span className="font-medium">{formatCurrency(savingsAmount)}</span>
                                </div>
                                <Progress value={savingsPercent} className="h-2" />
                              </div>
                              
                              <div className="p-3 border bg-muted/30 rounded-lg">
                                <h4 className="text-sm font-medium mb-1">Reasoning</h4>
                                <p className="text-sm">{suggestion.reasoning}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <Lightbulb className="h-5 w-5 text-green-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Budget Tips</h4>
                            <p className="text-sm">
                              These budget suggestions are based on analyzing your spending patterns compared to recommended financial guidelines. Implementing these adjustments could help you save up to {formatCurrency(insights.budgetSuggestions.reduce((total, item) => total + (item.currentSpending - item.suggestedBudget), 0))} per month.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>No Budget Suggestions Available</CardTitle>
                      <CardDescription>
                        We need more transaction data to create personalized budget suggestions.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <PieChartIcon className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                        <p className="text-lg mb-6">
                          Add more transactions to receive AI-powered budget suggestions.
                        </p>
                        <Button>Add Transactions</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              {/* Savings Goals Tab */}
              <TabsContent value="goals">
                {insights?.savingsGoals && insights.savingsGoals.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Target className="mr-2 h-5 w-5 text-purple-500" />
                        Personalized Savings Plan
                      </CardTitle>
                      <CardDescription>
                        A detailed plan to help you achieve your savings goals
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 p-6 rounded-lg mb-8">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold mb-2">Target: {formatCurrency(insights.savingsGoals[0].targetAmount)}</h3>
                            <p className="text-sm mb-4">
                              Achievable within {insights.savingsGoals[0].timeframeMonths} months through strategic spending adjustments
                            </p>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="bg-white/60 p-3 rounded-lg">
                                <p className="text-xs text-muted-foreground">Monthly Saving</p>
                                <p className="text-lg font-bold">
                                  {formatCurrency(insights.savingsGoals[0].targetAmount / insights.savingsGoals[0].timeframeMonths)}
                                </p>
                              </div>
                              <div className="bg-white/60 p-3 rounded-lg">
                                <p className="text-xs text-muted-foreground">Timeline</p>
                                <p className="text-lg font-bold flex items-center">
                                  <CalendarIcon className="mr-1 h-4 w-4" />
                                  {insights.savingsGoals[0].timeframeMonths} months
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 flex flex-col items-center justify-center">
                            <div className="relative flex items-center justify-center">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <svg className="w-32 h-32">
                                  <circle
                                    cx="64"
                                    cy="64"
                                    r="60"
                                    fill="none"
                                    stroke="#e4e4e7"
                                    strokeWidth="8"
                                  />
                                  <circle
                                    cx="64"
                                    cy="64"
                                    r="60"
                                    fill="none"
                                    stroke="#a855f7"
                                    strokeWidth="8"
                                    strokeDasharray="377"
                                    strokeDashoffset={377 * (1 - (1 / insights.savingsGoals[0].timeframeMonths))}
                                    strokeLinecap="round"
                                    transform="rotate(-90 64 64)"
                                  />
                                </svg>
                              </div>
                              <div className="text-center">
                                <DollarSign className="h-8 w-8 text-purple-500 mx-auto mb-1" />
                                <span className="block font-bold text-xl">
                                  {formatCurrency(insights.savingsGoals[0].targetAmount)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Strategy</h3>
                        <p className="text-muted-foreground mb-6">{insights.savingsGoals[0].reasoning}</p>
                        
                        <h3 className="text-lg font-semibold mb-4">Recommended Spending Adjustments</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b">
                                <th className="py-2 px-3 text-left">Category</th>
                                <th className="py-2 px-3 text-right">Current</th>
                                <th className="py-2 px-3 text-right">Reduction</th>
                                <th className="py-2 px-3 text-right">New Budget</th>
                                <th className="py-2 px-3 text-right">Monthly Savings</th>
                              </tr>
                            </thead>
                            <tbody>
                              {insights.savingsGoals[0].categoryCuts.map((cut, index) => {
                                const categoryInfo = getCategoryById(cut.category);
                                const newBudget = cut.currentSpending - cut.suggestedReduction;
                                const reductionPercent = Math.round((cut.suggestedReduction / cut.currentSpending) * 100);
                                
                                return (
                                  <tr key={index} className="border-b">
                                    <td className="py-3 px-3">
                                      <div className="flex items-center">
                                        <categoryInfo.icon className={`mr-2 h-4 w-4 ${categoryInfo.color}`} />
                                        <span>{categoryInfo.name}</span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                      {formatCurrency(cut.currentSpending)}
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                        {reductionPercent}% ({formatCurrency(cut.suggestedReduction)})
                                      </Badge>
                                    </td>
                                    <td className="py-3 px-3 text-right font-medium">
                                      {formatCurrency(newBudget)}
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                      <span className="font-medium text-green-600">
                                        + {formatCurrency(cut.monthlySavings)}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                              <tr className="bg-muted/50">
                                <td className="py-3 px-3 font-medium" colSpan={4}>
                                  Total Monthly Savings
                                </td>
                                <td className="py-3 px-3 text-right font-bold text-green-600">
                                  {formatCurrency(insights.savingsGoals[0].categoryCuts.reduce(
                                    (total, cut) => total + cut.monthlySavings, 0
                                  ))}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      <div className="mt-8 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <Lightbulb className="h-5 w-5 text-purple-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Savings Tips</h4>
                            <p className="text-sm">
                              By following this plan and making the suggested adjustments to your spending, you could save {formatCurrency(insights.savingsGoals[0].targetAmount)} within {insights.savingsGoals[0].timeframeMonths} months. Remember that small, consistent changes to your spending habits can lead to significant long-term results.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>No Savings Goals Available</CardTitle>
                      <CardDescription>
                        We need more transaction data to create personalized savings goals.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <Target className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                        <p className="text-lg mb-6">
                          Add more transactions to receive AI-powered savings goals.
                        </p>
                        <Button>Add Transactions</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              {/* Bill Reminders Tab */}
              <TabsContent value="bills">
                {insights?.billReminders && insights.billReminders.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Bell className="mr-2 h-5 w-5 text-amber-500" />
                        Upcoming Bill Reminders
                      </CardTitle>
                      <CardDescription>
                        AI-detected recurring payments based on your transaction history
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {insights.billReminders.map((bill, index) => {
                          const daysUntil = getDaysUntil(bill.dueDate);
                          const isUrgent = daysUntil <= 3;
                          const isSoon = daysUntil <= 7;
                          
                          return (
                            <div 
                              key={index} 
                              className={`p-4 border rounded-lg
                                ${isUrgent ? 'border-red-300 bg-red-50' : 
                                  isSoon ? 'border-amber-300 bg-amber-50' : ''}`}
                            >
                              <div className="flex items-start">
                                <div className={`p-3 rounded-full mr-4
                                  ${isUrgent ? 'bg-red-100' : 
                                    isSoon ? 'bg-amber-100' : 'bg-muted'}`}>
                                  <Clock className={`h-6 w-6
                                    ${isUrgent ? 'text-red-500' : 
                                      isSoon ? 'text-amber-500' : 'text-muted-foreground'}`} />
                                </div>
                                <div className="flex-1">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                                    <h3 className="text-lg font-semibold">{bill.description}</h3>
                                    <Badge variant="outline" className={getConfidenceColor(bill.confidence)}>
                                      {Math.round(bill.confidence * 100)}% confidence
                                    </Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                                    <div>
                                      <p className="text-xs text-muted-foreground">Amount</p>
                                      <p className="font-medium text-lg">{formatCurrency(bill.estimatedAmount)}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Due Date</p>
                                      <p className="font-medium">{formatDate(bill.dueDate)}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Status</p>
                                      <Badge 
                                        variant={isUrgent ? "destructive" : isSoon ? "default" : "outline"}
                                        className={!isUrgent && !isSoon ? "bg-muted" : ""}
                                      >
                                        {daysUntil <= 0 ? 'Due today' : 
                                          daysUntil === 1 ? 'Due tomorrow' : 
                                            `Due in ${daysUntil} days`}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm">
                                      Mark as Paid
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      Set Reminder
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium">About Bill Reminders</h4>
                            <p className="text-sm">
                              These bill reminders are generated by analyzing your recurring payment patterns. The AI identifies likely recurring expenses and their frequency to predict when they might be due next. The confidence score indicates how certain the system is about this prediction.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>No Bill Reminders Available</CardTitle>
                      <CardDescription>
                        We need more transaction data to detect recurring bills.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                        <p className="text-lg mb-6">
                          Add more transactions to receive AI-detected bill reminders.
                        </p>
                        <Button>Add Transactions</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              {/* Spending Patterns Tab */}
              <TabsContent value="patterns">
                {insights?.spendingPatterns && insights.spendingPatterns.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Activity className="mr-2 h-5 w-5 text-orange-500" />
                        Spending Pattern Analysis
                      </CardTitle>
                      <CardDescription>
                        Behavioral insights to help you optimize your spending habits
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {insights.spendingPatterns.map((pattern, index) => (
                          <div key={index} className="p-5 border rounded-lg">
                            <div className="flex items-start gap-4">
                              <div className="bg-orange-100 p-3 rounded-full">
                                <Flame className="h-6 w-6 text-orange-500" />
                              </div>
                              <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                                  <h3 className="text-lg font-semibold">{pattern.pattern}</h3>
                                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                    {Math.round(pattern.impact)}% impact
                                  </Badge>
                                </div>
                                
                                <div className="mb-4">
                                  <div className="text-sm mb-1">Percentage of your total spending affected</div>
                                  <div className="w-full bg-muted rounded-full h-2.5">
                                    <div 
                                      className="bg-orange-500 h-2.5 rounded-full" 
                                      style={{ width: `${Math.min(Math.round(pattern.impact), 100)}%` }}
                                    ></div>
                                  </div>
                                </div>
                                
                                <div className="bg-muted/40 p-4 rounded-lg">
                                  <h4 className="font-medium mb-2">Suggestion</h4>
                                  <p>{pattern.suggestion}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-8 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <Lightbulb className="h-5 w-5 text-orange-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium">How to Use These Insights</h4>
                            <p className="text-sm">
                              These spending patterns are identified by analyzing your transaction data for behavioral trends. The impact percentage indicates how much of your total spending is affected by each pattern. Focus on implementing the suggestions for patterns with higher impact to maximize your savings.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>No Spending Patterns Available</CardTitle>
                      <CardDescription>
                        We need more transaction data to detect spending patterns.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                        <p className="text-lg mb-6">
                          Add more transactions to receive AI-detected spending patterns.
                        </p>
                        <Button>Add Transactions</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </AppShell>
  );
}