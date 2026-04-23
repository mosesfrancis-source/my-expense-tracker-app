import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Observable } from 'rxjs';
import { Transaction } from '../models/transaction.model';
import { auth, db } from '../firebase';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  getTransactions(): Observable<Transaction[]> {
    return new Observable<Transaction[]>((subscriber) => {
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

          const ref = collection(db, 'transactions');
          dataUnsubscribe = onSnapshot(
            ref,
            (snapshot) => {
              const transactions = snapshot.docs
                .map((item) => ({ id: item.id, ...(item.data() as Omit<Transaction, 'id'>) }))
                .filter((transaction) => transaction.userId === user.uid)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

              subscriber.next(transactions);
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

  async getTransactionById(id: string): Promise<Transaction | null> {
    const ref = doc(db, `transactions/${id}`);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...(snap.data() as Omit<Transaction, 'id'>) } : null;
  }

  async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<void> {
    const ref = collection(db, 'transactions');
    await addDoc(ref, transaction);
  }

  async updateTransaction(id: string, updated: Partial<Transaction>): Promise<void> {
    const ref = doc(db, `transactions/${id}`);
    await updateDoc(ref, updated as any);
  }

  async deleteTransaction(transactionId: string): Promise<void> {
    const ref = doc(db, `transactions/${transactionId}`);
    await deleteDoc(ref);
  }
}
