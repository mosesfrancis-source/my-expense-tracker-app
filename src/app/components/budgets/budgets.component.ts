import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Budget } from '../../models/budget.model';
import { Category } from '../../models/category.model';
import { Transaction } from '../../models/transaction.model';
import { AuthService } from '../../services/auth.service';
import { BudgetService } from '../../services/budget.service';
import { CategoryService } from '../../services/category.service';
import { DashboardService } from '../../services/dashboard.service';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './budgets.component.html',
  styleUrl: './budgets.component.css',
})
export class BudgetsComponent implements OnInit {
  private fb = inject(FormBuilder);

  budgets: Budget[] = [];
  categories: Category[] = [];
  transactions: Transaction[] = [];

  loading = false;
  editingId = '';
  selectedMonth = this.getCurrentMonth();

  form = this.fb.nonNullable.group({
    month: [this.getCurrentMonth(), Validators.required],
    categoryId: ['', Validators.required],
    limit: [0, [Validators.required, Validators.min(1)]],
  });

  constructor(
    private budgetService: BudgetService,
    private categoryService: CategoryService,
    private transactionService: TransactionService,
    private dashboardService: DashboardService,
    private authService: AuthService,
  ) {}

  get monthBudgets(): Array<Budget & { spent: number; percent: number; alert: string }> {
    return this.dashboardService
      .getBudgetStatus(this.transactions, this.budgets, this.selectedMonth)
      .sort((a, b) => b.percent - a.percent);
  }

  ngOnInit(): void {
    this.budgetService.getBudgets().subscribe((budgets) => {
      this.budgets = budgets;
    });

    this.categoryService.getCategories().subscribe((categories) => {
      this.categories = categories.sort((a, b) => a.name.localeCompare(b.name));
    });

    this.transactionService.getTransactions().subscribe((transactions) => {
      this.transactions = transactions;
    });
  }

  async saveBudget() {
    if (this.form.invalid || this.loading) {
      return;
    }

    this.loading = true;
    try {
      const userId = this.authService.getCurrentUserId();
      if (!userId) {
        return;
      }

      const value = this.form.getRawValue();
      const category = this.categories.find((item) => item.id === value.categoryId);
      if (!category?.id) {
        return;
      }

      const duplicate = this.budgets.find(
        (budget) =>
          budget.id !== this.editingId &&
          budget.month === value.month &&
          budget.categoryId === value.categoryId,
      );

      if (duplicate) {
        this.editingId = duplicate.id || '';
      }

      const payload: Omit<Budget, 'id'> = {
        userId,
        month: value.month,
        categoryId: category.id,
        categoryName: category.name,
        limit: Number(value.limit),
      };

      if (this.editingId) {
        await this.budgetService.updateBudget(this.editingId, payload);
      } else {
        await this.budgetService.addBudget(payload);
      }

      this.cancelEdit();
      this.selectedMonth = value.month;
    } finally {
      this.loading = false;
    }
  }

  editBudget(item: Budget) {
    if (!item.id) {
      return;
    }

    this.editingId = item.id;
    this.form.patchValue({
      month: item.month,
      categoryId: item.categoryId,
      limit: item.limit,
    });
  }

  cancelEdit() {
    this.editingId = '';
    this.form.reset({
      month: this.selectedMonth,
      categoryId: '',
      limit: 0,
    });
  }

  async removeBudget(id?: string) {
    if (!id) {
      return;
    }
    await this.budgetService.deleteBudget(id);
  }

  getProgressWidth(percent: number): string {
    return `${Math.min(percent, 100)}%`;
  }

  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
