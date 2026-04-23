import { Injectable } from '@angular/core';
import { Budget } from '../models/budget.model';
import { Transaction } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  getMonthlyTransactions(transactions: Transaction[], month: string): Transaction[] {
    return transactions.filter((transaction) => this.toMonthKey(transaction.date) === month);
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
      const categoryName = transaction.categoryName || 'Uncategorized';
      grouped[categoryName] = (grouped[categoryName] || 0) + Number(transaction.amount);
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
              transaction.type === 'Expense' &&
              (transaction.categoryId === budget.categoryId ||
                transaction.categoryName === budget.categoryName),
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

  private toMonthKey(dateValue: unknown): string | null {
    if (!dateValue) {
      return null;
    }

    if (typeof dateValue === 'string') {
      if (/^\d{4}-\d{2}/.test(dateValue)) {
        return dateValue.slice(0, 7);
      }

      const parsed = new Date(dateValue);
      if (!Number.isNaN(parsed.getTime())) {
        return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
      }

      return null;
    }

    if (dateValue instanceof Date) {
      if (Number.isNaN(dateValue.getTime())) {
        return null;
      }
      return `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(2, '0')}`;
    }

    if (typeof dateValue === 'object' && dateValue !== null) {
      const maybeTimestamp = dateValue as {
        toDate?: () => Date;
        seconds?: number;
      };

      if (typeof maybeTimestamp.toDate === 'function') {
        const date = maybeTimestamp.toDate();
        if (!Number.isNaN(date.getTime())) {
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
      }

      if (typeof maybeTimestamp.seconds === 'number') {
        const date = new Date(maybeTimestamp.seconds * 1000);
        if (!Number.isNaN(date.getTime())) {
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
      }
    }

    return null;
  }
}
