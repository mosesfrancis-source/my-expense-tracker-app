import { Injectable } from '@angular/core';
import { Budget } from '../models/budget.model';
import { Transaction } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  getMonthlyTransactions(transactions: Transaction[], month: string): Transaction[] {
    return transactions.filter((transaction) => transaction.date.startsWith(month));
  }

  getTotalIncome(transactions: Transaction[]): number {
    return transactions
      .filter((transaction) => transaction.type === 'Income')
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  }

  getTotalExpense(transactions: Transaction[]): number {
    return transactions
      .filter((transaction) => transaction.type === 'Expense')
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  }

  getBalance(transactions: Transaction[]): number {
    return this.getTotalIncome(transactions) - this.getTotalExpense(transactions);
  }

  getCategorySummary(transactions: Transaction[]): Record<string, number> {
    const expenses = transactions.filter((transaction) => transaction.type === 'Expense');
    const grouped: Record<string, number> = {};

    for (const transaction of expenses) {
      grouped[transaction.categoryName] =
        (grouped[transaction.categoryName] || 0) + Number(transaction.amount);
    }

    return grouped;
  }

  getBudgetStatus(transactions: Transaction[], budgets: Budget[], month: string) {
    const monthTransactions = this.getMonthlyTransactions(transactions, month);

    return budgets
      .filter((budget) => budget.month === month)
      .map((budget) => {
        const spent = monthTransactions
          .filter(
            (transaction) =>
              transaction.type === 'Expense' && transaction.categoryId === budget.categoryId,
          )
          .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

        const percent = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;

        return {
          ...budget,
          spent,
          percent,
          alert: percent >= 100 ? 'Exceeded' : percent >= 80 ? 'Warning' : 'Safe',
        };
      });
  }
}
