import { users, type User, type InsertUser, transactions, type Transaction, type InsertTransaction } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getTransactions(userId: number): Promise<Transaction[]>;
  getTransactionsByMonth(userId: number, year: number, month: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction & { userId: number }): Promise<Transaction>;
  
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  sessionStore: session.SessionStore;
  currentUserId: number;
  currentTransactionId: number;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.currentUserId = 1;
    this.currentTransactionId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.userId === userId
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getTransactionsByMonth(userId: number, year: number, month: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(transaction => {
      const transDate = new Date(transaction.date);
      return (
        transaction.userId === userId &&
        transDate.getFullYear() === year &&
        transDate.getMonth() === month
      );
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createTransaction(transactionData: InsertTransaction & { userId: number }): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = {
      ...transactionData, 
      id,
      date: transactionData.date ? new Date(transactionData.date) : new Date()
    };
    this.transactions.set(id, transaction);
    return transaction;
  }
}

export const storage = new MemStorage();
