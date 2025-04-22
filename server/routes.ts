import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema, Insight } from "@shared/schema";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  generateAllInsights, AIInsights, generateSpendingForecast,
  generateBudgetSuggestions, generateSavingsGoal,
  detectBillReminders, detectSpendingPatterns
} from "./ai-insights";

// Helper function to ensure user is authenticated
function ensureAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Helper to generate insights based on transaction data
function generateInsights(
  currentMonth: { year: number; month: number }, 
  previousMonth: { year: number; month: number },
  userId: number
): Promise<Insight[]> {
  return new Promise(async (resolve) => {
    const insights: Insight[] = [];
    
    try {
      const currentMonthData = await storage.getTransactionsByMonth(
        userId, 
        currentMonth.year, 
        currentMonth.month
      );
      
      const previousMonthData = await storage.getTransactionsByMonth(
        userId, 
        previousMonth.year, 
        previousMonth.month
      );
      
      // Skip insights if not enough data
      if (previousMonthData.length === 0) {
        insights.push({
          text: "Welcome to your expense tracker! Add more transactions to get personalized insights.",
          type: "tip"
        });
        return resolve(insights);
      }
      
      // Group by category
      const currentByCategory = new Map<string, number>();
      const previousByCategory = new Map<string, number>();
      
      currentMonthData.filter(t => !t.isIncome).forEach(t => {
        const current = currentByCategory.get(t.category) || 0;
        currentByCategory.set(t.category, current + t.amount);
      });
      
      previousMonthData.filter(t => !t.isIncome).forEach(t => {
        const current = previousByCategory.get(t.category) || 0;
        previousByCategory.set(t.category, current + t.amount);
      });
      
      // Find significant changes
      for (const [category, amount] of currentByCategory.entries()) {
        const previousAmount = previousByCategory.get(category) || 0;
        
        // New category
        if (previousAmount === 0) {
          insights.push({
            text: `New spending category detected: ${category}. Consider if this is a one-time expense or a new budget item.`,
            type: "new_category"
          });
          continue;
        }
        
        // Increased spending (25% or more)
        const increasePercentage = Math.round(((amount - previousAmount) / previousAmount) * 100);
        if (increasePercentage >= 25) {
          insights.push({
            text: `Your ${category} expenses increased by ${increasePercentage}% compared to last month. Consider setting a budget for this category.`,
            type: "increase"
          });
        }
        
        // Decreased spending (25% or more)
        if (increasePercentage <= -25) {
          insights.push({
            text: `Great job! You reduced your ${category} expenses by ${Math.abs(increasePercentage)}% compared to last month.`,
            type: "decrease"
          });
        }
      }
      
      // If no insights were generated, add a generic tip
      if (insights.length === 0) {
        const tips = [
          "Try setting a monthly budget for each spending category to better track your expenses.",
          "Consider saving at least 20% of your income each month for financial security.",
          "Review your subscriptions regularly to identify services you no longer use."
        ];
        
        insights.push({
          text: tips[Math.floor(Math.random() * tips.length)],
          type: "tip"
        });
      }
      
      // Limit to 1-3 insights
      resolve(insights.slice(0, 3));
    } catch (error) {
      // If there's an error, return a generic insight
      insights.push({
        text: "Add more transactions to get personalized spending insights.",
        type: "tip"
      });
      resolve(insights);
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Transactions routes
  app.get("/api/transactions", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const transactions = await storage.getTransactions(userId);
    res.json(transactions);
  });

  app.post("/api/transactions", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const transactionData = insertTransactionSchema.parse(req.body);
      
      const transaction = await storage.createTransaction({
        ...transactionData,
        userId,
      });
      
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  app.get("/api/transactions/month/:year/:month", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      
      if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
        return res.status(400).json({ message: "Invalid year or month" });
      }
      
      const transactions = await storage.getTransactionsByMonth(userId, year, month);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Basic Insights route
  app.get("/api/insights", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    
    const now = new Date();
    const currentMonth = { year: now.getFullYear(), month: now.getMonth() };
    
    // Calculate previous month
    let previousMonth: { year: number; month: number };
    if (currentMonth.month === 0) {
      previousMonth = { year: currentMonth.year - 1, month: 11 };
    } else {
      previousMonth = { year: currentMonth.year, month: currentMonth.month - 1 };
    }
    
    try {
      const insights = await generateInsights(currentMonth, previousMonth, userId);
      res.json(insights);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate insights" });
    }
  });
  
  // Advanced AI Insights route
  app.get("/api/ai-insights", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    
    try {
      // Get all user transactions for AI analysis
      const transactions = await storage.getTransactions(userId);
      
      if (transactions.length < 5) {
        return res.json({
          message: "Add more transactions to receive AI-powered financial insights"
        });
      }
      
      // Generate AI insights using OpenAI
      const insights = await generateAllInsights(userId, transactions);
      res.json(insights);
    } catch (error) {
      console.error("Error generating AI insights:", error);
      res.status(500).json({ 
        message: "Failed to generate AI insights",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Specific AI insight endpoints
  app.get("/api/ai-insights/spending-forecast", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    
    try {
      const transactions = await storage.getTransactions(userId);
      const forecast = await generateSpendingForecast(userId, transactions);
      
      if (!forecast) {
        return res.json({
          message: "Not enough transaction data to generate a spending forecast"
        });
      }
      
      res.json(forecast);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate spending forecast" });
    }
  });
  
  app.get("/api/ai-insights/budget-suggestions", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    
    try {
      const transactions = await storage.getTransactions(userId);
      const suggestions = await generateBudgetSuggestions(userId, transactions);
      
      if (!suggestions) {
        return res.json({
          message: "Not enough transaction data to generate budget suggestions"
        });
      }
      
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate budget suggestions" });
    }
  });
  
  app.get("/api/ai-insights/savings-goals", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    
    try {
      const targetAmount = req.query.targetAmount ? 
        parseInt(req.query.targetAmount as string) : undefined;
        
      const transactions = await storage.getTransactions(userId);
      const savingsGoal = await generateSavingsGoal(userId, transactions, targetAmount);
      
      if (!savingsGoal) {
        return res.json({
          message: "Not enough transaction data to generate a savings goal"
        });
      }
      
      res.json(savingsGoal);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate savings goal" });
    }
  });
  
  app.get("/api/ai-insights/bill-reminders", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    
    try {
      const transactions = await storage.getTransactions(userId);
      const reminders = await detectBillReminders(userId, transactions);
      
      if (!reminders) {
        return res.json({
          message: "Not enough transaction data to detect recurring bills"
        });
      }
      
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate bill reminders" });
    }
  });
  
  app.get("/api/ai-insights/spending-patterns", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    
    try {
      const transactions = await storage.getTransactions(userId);
      const patterns = await detectSpendingPatterns(userId, transactions);
      
      if (!patterns) {
        return res.json({
          message: "Not enough transaction data to detect spending patterns"
        });
      }
      
      res.json(patterns);
    } catch (error) {
      res.status(500).json({ message: "Failed to detect spending patterns" });
    }
  });

  // Dashboard summary route
  app.get("/api/dashboard", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      const transactions = await storage.getTransactionsByMonth(userId, currentYear, currentMonth);
      
      let income = 0;
      let expenses = 0;
      
      transactions.forEach(transaction => {
        if (transaction.isIncome) {
          income += transaction.amount;
        } else {
          expenses += transaction.amount;
        }
      });
      
      const balance = income - expenses;
      
      res.json({
        balance,
        income,
        expenses,
        transactionCount: transactions.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
