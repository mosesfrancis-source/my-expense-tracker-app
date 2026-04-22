import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FirebaseError } from 'firebase/app';
import { AuthService } from '../../services/auth.service';
import { CategoryService } from '../../services/category.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  error = '';
  loading = false;
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    budgetGoal: [0, [Validators.required, Validators.min(0)]],
  });

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private categoryService: CategoryService,
    private router: Router,
  ) {}

  async onSubmit() {
    this.error = '';
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    const { name, email, password, budgetGoal } = this.form.getRawValue();

    try {
      const result = await this.authService.register(email, password);

      try {
        await this.userService.createUser(result.user.uid, {
          name,
          email,
          budgetGoal: Number(budgetGoal),
        });

        await this.categoryService.seedDefaultCategories();
      } catch {
        // Do not block authentication success if initial Firestore setup fails.
      }

      await this.router.navigate(['/dashboard']);
    } catch (error: any) {
      if (error instanceof FirebaseError && error.code === 'auth/operation-not-allowed') {
        this.error = 'Email/password is disabled. Switching to Google sign up...';
        await this.onGoogleRegister();
        return;
      }

      this.error = this.authService.getAuthErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }

  async onGoogleRegister() {
    this.error = '';
    this.loading = true;

    try {
      const result = await this.authService.loginWithGoogle();

      try {
        const existingUser = await this.userService.getUser(result.user.uid);
        if (!existingUser) {
          await this.userService.createUser(result.user.uid, {
            name: result.user.displayName ?? 'Google User',
            email: result.user.email ?? '',
            budgetGoal: 0,
          });

          await this.categoryService.seedDefaultCategories();
        }
      } catch {
        // Do not block auth success if Firestore initialization fails.
      }
    } catch (error: any) {
      this.error = this.authService.getAuthErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }
}
