import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CategoryService } from '../../services/category.service';
import { TransactionService } from '../../services/transaction.service';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.css',
})
export class TransactionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  categories: Category[] = [];
  readonly defaultCategoryOptions: Array<{ id: string; name: string }> = [
    { id: 'Food', name: 'Food' },
    { id: 'Rent', name: 'Rent' },
    { id: 'Travel', name: 'Travel' },
    { id: 'Salary', name: 'Salary' },
    { id: 'Shopping', name: 'Shopping' },
    { id: 'Utilities', name: 'Utilities' },
    { id: 'Health', name: 'Health' },
    { id: 'Entertainment', name: 'Entertainment' },
    { id: 'Other', name: 'Other' },
  ];
  loading = false;
  error = '';
  editing = false;
  transactionId = '';

  get allCategoryOptions(): Array<{ id: string; name: string }> {
    const firestoreCategories = this.categories.map((category) => ({
      id: category.id ?? category.name,
      name: category.name,
    }));

    const known = new Set(firestoreCategories.map((category) => category.name.toLowerCase()));
    const defaultsNotInFirestore = this.defaultCategoryOptions.filter(
      (category) => !known.has(category.name.toLowerCase()),
    );

    return [...firestoreCategories, ...defaultsNotInFirestore];
  }

  form = this.fb.nonNullable.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    categoryId: ['', Validators.required],
    categoryName: [''],
    date: ['', Validators.required],
    notes: [''],
    type: ['Expense' as 'Income' | 'Expense', Validators.required],
  });

  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (!this.form.value.date) {
      this.form.patchValue({ date: this.getTodayDateString() });
    }

    this.categoryService.getCategories().subscribe((categories) => {
      this.categories = categories;

      if (this.form.value.categoryId && !this.form.value.categoryName) {
        this.onCategoryChange();
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editing = true;
      this.transactionId = id;
      this.loadTransaction(id);
    }
  }

  async loadTransaction(id: string) {
    const transaction = await this.transactionService.getTransactionById(id);
    if (!transaction) {
      return;
    }

    this.form.patchValue({
      amount: transaction.amount,
      categoryId: transaction.categoryId,
      categoryName: transaction.categoryName,
      date: transaction.date,
      notes: transaction.notes,
      type: transaction.type,
    });
  }

  onCategoryChange() {
    const selected = this.allCategoryOptions.find(
      (category) => category.id === this.form.value.categoryId,
    );
    this.form.patchValue({ categoryName: selected?.name || '' });
  }

  async onSubmit() {
    this.error = '';

    if (this.form.invalid) {
      return;
    }

    this.loading = true;

    const value = this.form.getRawValue();
    const selectedCategory = this.allCategoryOptions.find((item) => item.id === value.categoryId);
    const userId = this.authService.getCurrentUserId();

    if (!userId) {
      this.error = 'Your session expired. Please sign in again.';
      this.loading = false;
      return;
    }

    const payload = {
      userId,
      amount: Number(value.amount),
      categoryId: value.categoryId,
      categoryName: selectedCategory?.name || value.categoryName || value.categoryId,
      date: value.date,
      notes: (value.notes || '').trim(),
      type: value.type,
    };

    try {
      if (this.editing) {
        await this.transactionService.updateTransaction(this.transactionId, payload);
      } else {
        await this.transactionService.addTransaction(payload);
      }

      await this.router.navigate(['/transactions']);
    } catch {
      this.error = 'Unable to save transaction right now. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  private getTodayDateString(): string {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }
}
