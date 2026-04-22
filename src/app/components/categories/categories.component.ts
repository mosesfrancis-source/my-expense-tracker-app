import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '../../models/category.model';
import { AuthService } from '../../services/auth.service';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css',
})
export class CategoriesComponent implements OnInit {
  private fb = inject(FormBuilder);

  categories: Category[] = [];
  loading = false;
  editingId = '';
  private seedingDefaults = false;

  readonly iconOptions = [
    'restaurant',
    'home',
    'flight',
    'payments',
    'shopping_cart',
    'bolt',
    'favorite',
    'movie',
    'category',
  ];

  readonly predefinedCategories: Array<Pick<Category, 'name' | 'icon' | 'color'>> = [
    { name: 'Food', icon: 'restaurant', color: '#f97316' },
    { name: 'Rent', icon: 'home', color: '#2563eb' },
    { name: 'Travel', icon: 'flight', color: '#0f766e' },
    { name: 'Salary', icon: 'payments', color: '#16a34a' },
    { name: 'Shopping', icon: 'shopping_cart', color: '#db2777' },
    { name: 'Utilities', icon: 'bolt', color: '#eab308' },
    { name: 'Health', icon: 'favorite', color: '#dc2626' },
    { name: 'Entertainment', icon: 'movie', color: '#7c3aed' },
    { name: 'Other', icon: 'category', color: '#64748b' },
  ];

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    icon: ['category', Validators.required],
    color: ['#2563eb', Validators.required],
  });

  constructor(
    private categoryService: CategoryService,
    private authService: AuthService,
  ) {}

  get defaultCategories(): Category[] {
    return this.categories
      .filter((category) => category.isDefault)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  get customCategories(): Category[] {
    return this.categories
      .filter((category) => !category.isDefault)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe((categories) => {
      this.categories = categories;
      void this.ensurePredefinedCategories(categories);
    });
  }

  async saveCategory() {
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
      const payload: Omit<Category, 'id'> = {
        userId,
        name: value.name.trim(),
        icon: value.icon,
        color: value.color,
        isDefault: false,
      };

      if (this.editingId) {
        await this.categoryService.updateCategory(this.editingId, payload);
      } else {
        await this.categoryService.addCategory(payload);
      }

      this.cancelEdit();
    } finally {
      this.loading = false;
    }
  }

  beginEdit(category: Category) {
    if (!category.id || category.isDefault) {
      return;
    }

    this.editingId = category.id;
    this.form.patchValue({
      name: category.name,
      icon: category.icon,
      color: category.color,
    });
  }

  cancelEdit() {
    this.editingId = '';
    this.form.reset({
      name: '',
      icon: 'category',
      color: '#2563eb',
    });
  }

  async removeCategory(category: Category) {
    if (!category.id || category.isDefault) {
      return;
    }
    await this.categoryService.deleteCategory(category.id);
  }

  private async ensurePredefinedCategories(existing: Category[]) {
    if (this.seedingDefaults) {
      return;
    }

    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      return;
    }

    const existingNames = new Set(existing.map((category) => category.name.toLowerCase()));
    const missing = this.predefinedCategories.filter(
      (category) => !existingNames.has(category.name.toLowerCase()),
    );

    if (!missing.length) {
      return;
    }

    this.seedingDefaults = true;
    try {
      for (const category of missing) {
        await this.categoryService.addCategory({
          userId,
          name: category.name,
          icon: category.icon,
          color: category.color,
          isDefault: true,
        });
      }
    } finally {
      this.seedingDefaults = false;
    }
  }
}
