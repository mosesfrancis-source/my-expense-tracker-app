import { Injectable } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Observable } from 'rxjs';
import { Budget } from '../models/budget.model';
import { AuthService } from './auth.service';
import { db } from '../firebase';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  constructor(private authService: AuthService) {}

  getBudgets(): Observable<Budget[]> {
    return new Observable<Budget[]>((subscriber) => {
      const ref = collection(db, 'budgets');
      const unsubscribe = onSnapshot(
        ref,
        (snapshot) => {
          const userId = this.authService.getCurrentUserId();
          const budgets = snapshot.docs
            .map((item) => ({ id: item.id, ...(item.data() as Omit<Budget, 'id'>) }))
            .filter((budget) => budget.userId === userId)
            .sort((a, b) => b.month.localeCompare(a.month));

          subscriber.next(budgets);
        },
        (error) => subscriber.error(error),
      );

      return () => unsubscribe();
    });
  }

  async addBudget(budget: Omit<Budget, 'id'>): Promise<void> {
    const ref = collection(db, 'budgets');
    await addDoc(ref, budget);
  }

  async updateBudget(id: string, budget: Partial<Budget>): Promise<void> {
    const ref = doc(db, `budgets/${id}`);
    await updateDoc(ref, budget as any);
  }

  async deleteBudget(id: string): Promise<void> {
    const ref = doc(db, `budgets/${id}`);
    await deleteDoc(ref);
  }
}
