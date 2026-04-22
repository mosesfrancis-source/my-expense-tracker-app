import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Budget } from '../../models/budget.model';
import { Category } from '../../models/category.model';
import { Transaction } from '../../models/transaction.model';
import { AppUser } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { BudgetService } from '../../services/budget.service';
import { CategoryService } from '../../services/category.service';
import { DashboardService } from '../../services/dashboard.service';
import { TransactionService } from '../../services/transaction.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  transactions: Transaction[] = [];
  budgets: Budget[] = [];
  categories: Category[] = [];
  profile: AppUser | null = null;
  selectedMonth = this.getCurrentMonth();

  readonly chartColors = [
    '#2563eb',
    '#f97316',
    '#0f766e',
    '#db2777',
    '#16a34a',
    '#eab308',
    '#7c3aed',
    '#06b6d4',
    '#94a3b8',
  ];

  constructor(
    private transactionService: TransactionService,
    private budgetService: BudgetService,
    private categoryService: CategoryService,
    private userService: UserService,
    private authService: AuthService,
    private dashboardService: DashboardService,
  ) {}

  ngOnInit(): void {
    this.transactionService.getTransactions().subscribe((transactions) => {
      this.transactions = transactions;
    });

    this.budgetService.getBudgets().subscribe((budgets) => {
      this.budgets = budgets;
    });

    this.categoryService.getCategories().subscribe((categories) => {
      this.categories = categories;
    });

    void this.loadProfile();
  }

  get monthBudgetCount(): number {
    return this.budgets.filter((budget) => budget.month === this.selectedMonth).length;
  }

  get customCategoryCount(): number {
    return this.categories.filter((category) => !category.isDefault).length;
  }

  get monthlyGoal(): number {
    return Number(this.profile?.budgetGoal || 0);
  }

  get monthTransactions(): Transaction[] {
    return this.dashboardService.getMonthlyTransactions(this.transactions, this.selectedMonth);
  }

  get totalIncome(): number {
    return this.dashboardService.getTotalIncome(this.monthTransactions);
  }

  get totalExpense(): number {
    return this.dashboardService.getTotalExpense(this.monthTransactions);
  }

  get balance(): number {
    return this.dashboardService.getBalance(this.monthTransactions);
  }

  get categoryPieData(): Array<{ name: string; value: number; color: string; percent: number }> {
    const summary = this.dashboardService.getCategorySummary(this.monthTransactions);
    const total = Math.max(
      1,
      Object.values(summary).reduce((sum, value) => sum + Number(value), 0),
    );

    return Object.entries(summary)
      .map(([name, value], index) => ({
        name,
        value: Number(value),
        color: this.chartColors[index % this.chartColors.length],
        percent: (Number(value) / total) * 100,
      }))
      .sort((a, b) => b.value - a.value);
  }

  get incomeExpenseBars(): Array<{
    label: string;
    value: number;
    width: string;
    className: string;
  }> {
    const income = this.totalIncome;
    const expense = this.totalExpense;
    const max = Math.max(1, income, expense);

    return [
      {
        label: 'Income',
        value: income,
        width: `${(income / max) * 100}%`,
        className: 'income',
      },
      {
        label: 'Expense',
        value: expense,
        width: `${(expense / max) * 100}%`,
        className: 'expense',
      },
    ];
  }

  get budgetComparison() {
    return this.dashboardService.getBudgetStatus(
      this.transactions,
      this.budgets,
      this.selectedMonth,
    );
  }

  get pieBackground(): string {
    if (!this.categoryPieData.length) {
      return 'conic-gradient(#e2e8f0 0deg 360deg)';
    }

    let cumulative = 0;
    const parts = this.categoryPieData.map((item) => {
      const start = cumulative;
      cumulative += item.percent;
      return `${item.color} ${start}% ${Math.min(cumulative, 100)}%`;
    });

    return `conic-gradient(${parts.join(', ')})`;
  }

  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private async loadProfile() {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.profile = null;
      return;
    }

    this.profile = await this.userService.getUser(userId);
  }
}
