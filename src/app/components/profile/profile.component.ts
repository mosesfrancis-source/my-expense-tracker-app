import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);

  loading = false;
  saving = false;
  message = '';

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: [{ value: '', disabled: true }],
    budgetGoal: [0, [Validators.required, Validators.min(0)]],
  });

  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.loading = true;
    try {
      const userId = this.authService.getCurrentUserId();
      const authUser = this.authService.currentUserSignal();

      if (!userId || !authUser) {
        this.message = 'You must be signed in to edit your profile.';
        return;
      }

      const profile = await this.userService.getUser(userId);
      this.form.patchValue({
        name: profile?.name || authUser.displayName || '',
        email: profile?.email || authUser.email || '',
        budgetGoal: profile?.budgetGoal || 0,
      });
    } finally {
      this.loading = false;
    }
  }

  async saveProfile() {
    if (this.form.invalid || this.saving) {
      return;
    }

    this.saving = true;
    this.message = '';

    try {
      const userId = this.authService.getCurrentUserId();
      const authUser = this.authService.currentUserSignal();
      if (!userId || !authUser) {
        this.message = 'Unable to update profile right now.';
        return;
      }

      const value = this.form.getRawValue();
      await this.userService.updateUser(userId, {
        name: value.name,
        budgetGoal: Number(value.budgetGoal),
      });

      this.message = 'Profile updated successfully.';
    } catch {
      this.message = 'Profile update failed. Please try again.';
    } finally {
      this.saving = false;
    }
  }
}
