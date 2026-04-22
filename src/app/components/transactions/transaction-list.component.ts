import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Transaction } from '../../models/transaction.model';
import { CategoryService } from '../../services/category.service';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './transaction-list.component.html',
  styleUrl: './transaction-list.component.css',
})
export class TransactionListComponent implements OnInit {
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  categories: Array<{ name: string }> = [];

  fromDate = '';
  toDate = '';
  selectedCategory = '';
  minAmount: number | null = null;
  maxAmount: number | null = null;

  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.transactionService.getTransactions().subscribe((transactions) => {
      this.transactions = transactions;
      this.applyFilters();
    });

    this.categoryService.getCategories().subscribe((categories) => {
      this.categories = categories;
    });
  }

  applyFilters() {
    this.filteredTransactions = this.transactions.filter((transaction) => {
      const txDate = new Date(transaction.date).getTime();
      const from = this.fromDate ? new Date(this.fromDate).getTime() : null;
      const to = this.toDate ? new Date(this.toDate).getTime() : null;

      const matchDate = (!from || txDate >= from) && (!to || txDate <= to);
      const matchCategory =
        !this.selectedCategory || transaction.categoryName === this.selectedCategory;
      const amount = Number(transaction.amount);
      const matchMin = this.minAmount == null || amount >= this.minAmount;
      const matchMax = this.maxAmount == null || amount <= this.maxAmount;

      return matchDate && matchCategory && matchMin && matchMax;
    });
  }

  edit(id?: string) {
    if (!id) {
      return;
    }
    this.router.navigate(['/transactions/edit', id]);
  }

  async remove(id?: string) {
    if (!id) {
      return;
    }
    await this.transactionService.deleteTransaction(id);
  }
}
