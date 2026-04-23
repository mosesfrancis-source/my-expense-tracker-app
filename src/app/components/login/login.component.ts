import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  errorMessage = '';
  loading = false;
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (this.authService.currentUserSignal()) {
      void this.goToDashboard();
    }
  }

  async onSubmit() {
    this.loading = true;
    this.errorMessage = '';

    if (this.form.invalid) {
      this.loading = false;
      return;
    }

    try {
      await this.authService.login(
        this.form.getRawValue().email.trim(),
        this.form.getRawValue().password,
      );
      await this.goToDashboard();
    } catch (error) {
      this.errorMessage = this.authService.getAuthErrorMessage(error);
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  async onGoogleSignIn() {
    this.errorMessage = '';
    this.loading = true;

    try {
      await this.authService.loginWithGoogle();
      await this.goToDashboard();
    } catch (error) {
      this.errorMessage = this.authService.getAuthErrorMessage(error);
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  private async goToDashboard() {
    const navigated = await this.router.navigate(['/dashboard']);

    if (!navigated) {
      await this.router.navigateByUrl('/dashboard');
    }
  }
}
