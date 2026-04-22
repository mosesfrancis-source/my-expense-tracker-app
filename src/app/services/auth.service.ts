import { Injectable, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { Router } from '@angular/router';
import { auth } from '../firebase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUserSignal = signal<User | null>(null);
  private readonly authTimeoutMs = 15000;

  constructor(private router: Router) {
    onAuthStateChanged(auth, (user) => this.currentUserSignal.set(user));
  }

  async register(email: string, password: string) {
    return await this.withTimeout(createUserWithEmailAndPassword(auth, email, password));
  }

  async login(email: string, password: string) {
    const result = await this.withTimeout(signInWithEmailAndPassword(auth, email, password));
    await this.router.navigate(['/dashboard']);
    return result;
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await this.withTimeout(signInWithPopup(auth, provider));
    await this.router.navigate(['/dashboard']);
    return result;
  }

  async logout() {
    await signOut(auth);
    await this.router.navigate(['/login']);
  }

  getCurrentUserId(): string {
    return auth.currentUser?.uid || '';
  }

  getAuthErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message === 'AUTH_TIMEOUT') {
      return 'Authentication timed out. Check your internet and try again.';
    }

    if (!(error instanceof FirebaseError)) {
      return 'Something went wrong. Please try again.';
    }

    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'This email is already in use. Try signing in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password is too weak. Use at least 6 characters.';
      case 'auth/operation-not-allowed':
        return 'Email/password sign-in is disabled in Firebase Authentication.';
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Invalid email or password.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait a bit and try again.';
      case 'auth/network-request-failed':
        return 'Network error. Check your connection and try again.';
      default:
        return error.message;
    }
  }

  private async withTimeout<T>(promise: Promise<T>): Promise<T> {
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error('AUTH_TIMEOUT')), this.authTimeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }
}
