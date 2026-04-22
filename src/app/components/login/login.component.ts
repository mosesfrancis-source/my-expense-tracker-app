import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  error = '';
  loading = false;
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor(private authService: AuthService) {}

  async onSubmit() {
    this.error = '';
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    try {
      await this.authService.login(this.form.getRawValue().email, this.form.getRawValue().password);
    } catch (error: any) {
      this.error = this.authService.getAuthErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }

  async onGoogleSignIn() {
    this.error = '';
    this.loading = true;

    try {
      await this.authService.loginWithGoogle();
    } catch (error: any) {
      this.error = this.authService.getAuthErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }
}
