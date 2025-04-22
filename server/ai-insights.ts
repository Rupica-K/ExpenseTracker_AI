import OpenAI from "openai";
import { Transaction } from "@shared/schema";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Types for AI insights
export interface SpendingForecast {
  nextMonth: {
    totalExpense: number;
    categoryBreakdown: {
      [category: string]: number;
    };
  };
  confidence: number;
}

export interface BudgetSuggestion {
  category: string;
  currentSpending: number;
  suggestedBudget: number;
  reasoning: string;
}

export interface SavingsGoal {
  targetAmount: number;
  timeframeMonths: number;
  categoryCuts: {
    category: string;
    currentSpending: number;
    suggestedReduction: number;
    monthlySavings: number;
  }[];
  reasoning: string;
}

export interface BillReminder {
  description: string;
  estimatedAmount: number;
  dueDate: string;
  confidence: number;
}

export interface SpendingPattern {
  pattern: string;
  impact: number; // Percentage of overall spending
  suggestion: string;
}

export interface AIInsights {
  spendingForecast?: SpendingForecast;
  budgetSuggestions?: BudgetSuggestion[];
  savingsGoals?: SavingsGoal[];
  billReminders?: BillReminder[];
  spendingPatterns?: SpendingPattern[];
}

/**
 * Generate spending forecast based on transaction history
 */
export async function generateSpendingForecast(
  userId: number,
  transactions: Transaction[]
): Promise<SpendingForecast | null> {
  try {
    if (transactions.length < 5) {
      return null; // Not enough data for a forecast
    }

    // Extract expense transactions (not income)
    const expenses = transactions.filter((t) => !t.isIncome);
    
    // Convert transaction amounts from cents to rupees for better readability
    const formattedTransactions = expenses.map(t => ({
      ...t,
      amount: t.amount / 100,
      date: new Date(t.date).toISOString().split('T')[0]
    }));

    // Organize transactions by category
    const byCategory: { [key: string]: number[] } = {};
    formattedTransactions.forEach(t => {
      if (!byCategory[t.category]) {
        byCategory[t.category] = [];
      }
      byCategory[t.category].push(t.amount);
    });

    // Calculate total and average by category
    const categoryTotals: { [key: string]: { total: number, avg: number } } = {};
    for (const [category, amounts] of Object.entries(byCategory)) {
      const total = amounts.reduce((sum, amount) => sum + amount, 0);
      categoryTotals[category] = {
        total,
        avg: total / amounts.length
      };
    }

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a financial analyst assistant that creates spending forecasts based on transaction history. Provide the forecast in JSON format with categoryBreakdown and confidence level (0-1)."
        },
        {
          role: "user",
          content: `Based on these transaction patterns, generate a spending forecast for next month in Indian Rupees (₹). 
          User transaction history: ${JSON.stringify(formattedTransactions)}
          Category analysis: ${JSON.stringify(categoryTotals)}
          
          Provide the forecast in JSON format with:
          1. Expected total expense amount
          2. Breakdown by category 
          3. Confidence level (0-1)`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      nextMonth: {
        totalExpense: Math.round(result.totalExpense || 0),
        categoryBreakdown: result.categoryBreakdown || {}
      },
      confidence: result.confidence || 0.5
    };
  } catch (error) {
    console.error("Error generating spending forecast:", error);
    return null;
  }
}

/**
 * Generate budget suggestions based on transaction history
 */
export async function generateBudgetSuggestions(
  userId: number,
  transactions: Transaction[]
): Promise<BudgetSuggestion[] | null> {
  try {
    if (transactions.length < 5) {
      return null; // Not enough data
    }

    // Extract expense transactions (not income)
    const expenses = transactions.filter((t) => !t.isIncome);
    
    // Convert transaction amounts from cents to rupees for better readability
    const formattedTransactions = expenses.map(t => ({
      ...t,
      amount: t.amount / 100,
      date: new Date(t.date).toISOString().split('T')[0]
    }));

    // Group by category
    const byCategory: { [key: string]: { total: number, count: number, transactions: any[] } } = {};
    formattedTransactions.forEach(t => {
      if (!byCategory[t.category]) {
        byCategory[t.category] = { total: 0, count: 0, transactions: [] };
      }
      byCategory[t.category].total += t.amount;
      byCategory[t.category].count++;
      byCategory[t.category].transactions.push(t);
    });

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a financial advisor that creates personalized budget suggestions based on spending patterns. Provide suggestions in JSON format."
        },
        {
          role: "user",
          content: `Based on these spending patterns in Indian Rupees (₹), generate budget suggestions for up to 3 categories where the user could improve. 
          
          Category spending: ${JSON.stringify(byCategory, null, 2)}
          
          Format each suggestion as a JSON object with:
          1. category name
          2. current monthly spending
          3. suggested budget (in rupees)
          4. brief reasoning for the suggestion`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    if (Array.isArray(result.suggestions)) {
      return result.suggestions.map((suggestion: any) => ({
        category: suggestion.category,
        currentSpending: Math.round(suggestion.currentSpending || 0),
        suggestedBudget: Math.round(suggestion.suggestedBudget || 0),
        reasoning: suggestion.reasoning || ""
      }));
    }
    return null;
  } catch (error) {
    console.error("Error generating budget suggestions:", error);
    return null;
  }
}

/**
 * Generate savings goals based on transaction history
 */
export async function generateSavingsGoal(
  userId: number,
  transactions: Transaction[],
  targetAmount?: number
): Promise<SavingsGoal | null> {
  try {
    if (transactions.length < 5) {
      return null; // Not enough data
    }

    // Extract expense transactions (not income)
    const expenses = transactions.filter((t) => !t.isIncome);
    
    // Convert transaction amounts from cents to rupees for better readability
    const formattedTransactions = expenses.map(t => ({
      ...t,
      amount: t.amount / 100,
      date: new Date(t.date).toISOString().split('T')[0]
    }));

    // Group by category
    const byCategory: { [key: string]: number[] } = {};
    formattedTransactions.forEach(t => {
      if (!byCategory[t.category]) {
        byCategory[t.category] = [];
      }
      byCategory[t.category].push(t.amount);
    });

    // Calculate total and average by category
    const categoryAnalysis: { [key: string]: { total: number, avg: number, transactions: number } } = {};
    for (const [category, amounts] of Object.entries(byCategory)) {
      const total = amounts.reduce((sum, amount) => sum + amount, 0);
      categoryAnalysis[category] = {
        total,
        avg: total / amounts.length,
        transactions: amounts.length
      };
    }

    // Default target amount if not provided
    const goalAmount = targetAmount || 5000; // Default ₹5,000

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a financial advisor that creates personalized savings goals based on spending patterns. Provide suggestions in JSON format."
        },
        {
          role: "user",
          content: `Based on these spending patterns in Indian Rupees (₹), generate a realistic savings goal to save ₹${goalAmount}.
          
          Category spending: ${JSON.stringify(categoryAnalysis, null, 2)}
          
          Create a JSON response with:
          1. targetAmount (the goal amount in rupees)
          2. timeframeMonths (realistic number of months to achieve the goal, between 1-12)
          3. categoryCuts (array of categories where spending can be reduced)
             - Each categoryCut should have: category, currentSpending, suggestedReduction, and monthlySavings
          4. brief reasoning explaining the plan`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      targetAmount: result.targetAmount || goalAmount,
      timeframeMonths: result.timeframeMonths || 3,
      categoryCuts: Array.isArray(result.categoryCuts) ? result.categoryCuts.map((cut: any) => ({
        category: cut.category,
        currentSpending: Math.round(cut.currentSpending || 0),
        suggestedReduction: Math.round(cut.suggestedReduction || 0),
        monthlySavings: Math.round(cut.monthlySavings || 0)
      })) : [],
      reasoning: result.reasoning || ""
    };
  } catch (error) {
    console.error("Error generating savings goal:", error);
    return null;
  }
}

/**
 * Detect recurring bills and generate reminders
 */
export async function detectBillReminders(
  userId: number,
  transactions: Transaction[]
): Promise<BillReminder[] | null> {
  try {
    if (transactions.length < 10) {
      return null; // Need more transaction history for pattern detection
    }

    // Extract expense transactions (not income)
    const expenses = transactions.filter((t) => !t.isIncome);
    
    // Convert transaction amounts from cents to rupees for better readability
    const formattedTransactions = expenses.map(t => ({
      ...t,
      amount: t.amount / 100,
      date: new Date(t.date).toISOString().split('T')[0]
    }));

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a financial assistant that identifies recurring bill patterns from transaction history. Provide detected bill reminders in JSON format."
        },
        {
          role: "user",
          content: `Based on these transactions in Indian Rupees (₹), identify any recurring bills or subscriptions and when they might be due next.
          
          Transaction history: ${JSON.stringify(formattedTransactions, null, 2)}
          
          Create a JSON response with an array of bill reminders, each containing:
          1. description (what the bill seems to be for)
          2. estimatedAmount (in rupees)
          3. dueDate (estimated next due date in YYYY-MM-DD format)
          4. confidence (0-1 indicating how confident you are in this prediction)`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    if (Array.isArray(result.billReminders)) {
      return result.billReminders.map((reminder: any) => ({
        description: reminder.description || "",
        estimatedAmount: Math.round(reminder.estimatedAmount || 0),
        dueDate: reminder.dueDate || "",
        confidence: reminder.confidence || 0.5
      }));
    }
    return null;
  } catch (error) {
    console.error("Error detecting bill reminders:", error);
    return null;
  }
}

/**
 * Detect spending patterns and provide behavioral insights
 */
export async function detectSpendingPatterns(
  userId: number,
  transactions: Transaction[]
): Promise<SpendingPattern[] | null> {
  try {
    if (transactions.length < 10) {
      return null; // Need more transaction history for pattern detection
    }

    // Extract expense transactions (not income)
    const expenses = transactions.filter((t) => !t.isIncome);
    
    // Convert transaction amounts from cents to rupees for better readability
    const formattedTransactions = expenses.map(t => ({
      ...t,
      amount: t.amount / 100,
      date: new Date(t.date).toISOString().split('T')[0]
    }));

    // Prepare additional metadata for pattern detection
    const dates = formattedTransactions.map(t => new Date(t.date));
    const dayOfWeekDistribution: { [key: string]: number } = {
      "Monday": 0, "Tuesday": 0, "Wednesday": 0, 
      "Thursday": 0, "Friday": 0, "Saturday": 0, "Sunday": 0
    };
    
    dates.forEach(date => {
      const day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()];
      dayOfWeekDistribution[day]++;
    });

    // Get total expenses
    const totalExpense = formattedTransactions.reduce((sum, t) => sum + t.amount, 0);

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a financial behavior analyst that identifies spending patterns and provides helpful insights. Provide detected patterns in JSON format."
        },
        {
          role: "user",
          content: `Based on these transactions in Indian Rupees (₹), identify behavioral spending patterns that could help the user save money.
          
          Transaction history: ${JSON.stringify(formattedTransactions.slice(0, 20), null, 2)}
          Day of week distribution: ${JSON.stringify(dayOfWeekDistribution, null, 2)}
          Total expenses: ₹${totalExpense}
          
          Create a JSON response with an array of spending patterns, each containing:
          1. pattern (description of the detected pattern)
          2. impact (approximate percentage of total spending affected by this pattern)
          3. suggestion (helpful advice for managing this spending pattern)`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    if (Array.isArray(result.patterns)) {
      return result.patterns.map((pattern: any) => ({
        pattern: pattern.pattern || "",
        impact: pattern.impact || 0,
        suggestion: pattern.suggestion || ""
      }));
    }
    return null;
  } catch (error) {
    console.error("Error detecting spending patterns:", error);
    return null;
  }
}

/**
 * Generate all AI insights
 */
export async function generateAllInsights(
  userId: number,
  transactions: Transaction[]
): Promise<AIInsights> {
  const insights: AIInsights = {};

  // Run all insight generators in parallel
  const [
    spendingForecast,
    budgetSuggestions,
    savingsGoal,
    billReminders,
    spendingPatterns
  ] = await Promise.all([
    generateSpendingForecast(userId, transactions),
    generateBudgetSuggestions(userId, transactions),
    generateSavingsGoal(userId, transactions),
    detectBillReminders(userId, transactions),
    detectSpendingPatterns(userId, transactions)
  ]);

  // Add successful insights to result
  if (spendingForecast) insights.spendingForecast = spendingForecast;
  if (budgetSuggestions) insights.budgetSuggestions = budgetSuggestions;
  if (savingsGoal) insights.savingsGoals = [savingsGoal];
  if (billReminders) insights.billReminders = billReminders;
  if (spendingPatterns) insights.spendingPatterns = spendingPatterns;

  return insights;
}