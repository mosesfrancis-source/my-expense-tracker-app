import { Injectable } from '@angular/core';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { AppUser } from '../models/user.model';
import { db } from '../firebase';

@Injectable({ providedIn: 'root' })
export class UserService {
  async createUser(userId: string, user: AppUser) {
    const userRef = doc(db, `users/${userId}`);
    await setDoc(userRef, user);
  }

  async getUser(userId: string): Promise<AppUser | null> {
    const userRef = doc(db, `users/${userId}`);
    const snap = await getDoc(userRef);
    return snap.exists() ? (snap.data() as AppUser) : null;
  }

  async updateUser(userId: string, user: Partial<AppUser>) {
    const userRef = doc(db, `users/${userId}`);
    await updateDoc(userRef, user as any);
  }
}
