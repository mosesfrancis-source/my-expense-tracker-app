import { Injectable, signal } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Observable } from 'rxjs';
import { Category } from '../models/category.model';
import { AuthService } from './auth.service';
import { db } from '../firebase';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  categoriesSignal = signal<Category[]>([]);

  constructor(private authService: AuthService) {}

  getCategories(): Observable<Category[]> {
    return new Observable<Category[]>((subscriber) => {
      const ref = collection(db, 'categories');
      const unsubscribe = onSnapshot(
        ref,
        (snapshot) => {
          const userId = this.authService.getCurrentUserId();
          const categories = snapshot.docs
            .map((item) => ({ id: item.id, ...(item.data() as Omit<Category, 'id'>) }))
            .filter((category) => category.userId === userId);

          subscriber.next(categories);
        },
        (error) => subscriber.error(error),
      );

      return () => unsubscribe();
    });
  }

  async addCategory(category: Omit<Category, 'id'>) {
    const ref = collection(db, 'categories');
    await addDoc(ref, category);
  }

  async updateCategory(id: string, category: Partial<Category>) {
    const ref = doc(db, `categories/${id}`);
    await updateDoc(ref, category as any);
  }

  async deleteCategory(id: string) {
    const ref = doc(db, `categories/${id}`);
    await deleteDoc(ref);
  }

  async seedDefaultCategories() {
    const userId = this.authService.getCurrentUserId();
    const defaults: Omit<Category, 'id'>[] = [
      { userId, name: 'Food', icon: 'restaurant', color: '#f97316', isDefault: true },
      { userId, name: 'Rent', icon: 'home', color: '#2563eb', isDefault: true },
      { userId, name: 'Travel', icon: 'flight', color: '#0f766e', isDefault: true },
      { userId, name: 'Salary', icon: 'payments', color: '#16a34a', isDefault: true },
      { userId, name: 'Shopping', icon: 'shopping_cart', color: '#db2777', isDefault: true },
    ];

    for (const category of defaults) {
      await this.addCategory(category);
    }
  }
}
