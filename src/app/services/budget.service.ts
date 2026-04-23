import { Injectable } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Observable } from 'rxjs';
import { Budget } from '../models/budget.model';
import { auth, db } from '../firebase';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  getBudgets(): Observable<Budget[]> {
    return new Observable<Budget[]>((subscriber) => {
      let dataUnsubscribe: (() => void) | undefined;

      const authUnsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          if (dataUnsubscribe) {
            dataUnsubscribe();
            dataUnsubscribe = undefined;
          }

          if (!user) {
            subscriber.next([]);
            return;
          }

          const ref = collection(db, 'budgets');
          dataUnsubscribe = onSnapshot(
            ref,
            (snapshot) => {
              const budgets = snapshot.docs
                .map((item) => ({ id: item.id, ...(item.data() as Omit<Budget, 'id'>) }))
                .filter((budget) => budget.userId === user.uid)
                .sort((a, b) => b.month.localeCompare(a.month));

              subscriber.next(budgets);
            },
            (error) => subscriber.error(error),
          );
        },
        (error) => subscriber.error(error),
      );

      return () => {
        if (dataUnsubscribe) {
          dataUnsubscribe();
        }
        authUnsubscribe();
      };
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
