import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseError } from 'firebase/app';
import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  currentUserSignal = signal<User | null>(null);
  private readonly authTimeoutMs = 15000;

  constructor(private router: Router) {
    onAuthStateChanged(auth, (user) => {
      this.currentUserSignal.set(user);
    });
  }

  async register(email: string, password: string) {
    return this.runWithTimeout(createUserWithEmailAndPassword(auth, email, password));
  }

  async login(email: string, password: string) {
    return this.runWithTimeout(signInWithEmailAndPassword(auth, email, password));
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return this.runWithTimeout(signInWithPopup(auth, provider));
  }

  async logout() {
    await signOut(auth);
    await this.router.navigate(['/login']);
  }

  getCurrentUserId(): string {
    return auth.currentUser?.uid ?? '';
  }

  getAuthErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message === 'AUTH_TIMEOUT') {
      return 'Authentication timed out. Please check your internet connection and try again.';
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
      case 'auth/invalid-login-credentials':
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Invalid email or password.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait a moment and try again.';
      case 'auth/network-request-failed':
        return 'Network error. Check your connection and try again.';
      case 'auth/popup-closed-by-user':
        return 'The Google sign-in popup was closed before completing sign in.';
      case 'auth/popup-blocked':
        return 'The popup was blocked by your browser. Please allow popups and try again.';
      case 'auth/unauthorized-domain':
        return 'This domain is not authorized in Firebase Authentication.';
      default:
        return error.message || 'Authentication failed. Please try again.';
    }
  }

  private async runWithTimeout<T>(request: Promise<T>): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('AUTH_TIMEOUT'));
      }, this.authTimeoutMs);
    });

    try {
      return await Promise.race([request, timeoutPromise]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }
}
