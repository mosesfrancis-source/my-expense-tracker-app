import { Routes } from '@angular/router';
import { BudgetsComponent } from './components/budgets/budgets.component';
import { CategoriesComponent } from './components/categories/categories.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { ProfileComponent } from './components/profile/profile.component';
import { RegisterComponent } from './components/register/register.component';
import { TransactionFormComponent } from './components/transactions/transaction-form.component';
import { TransactionListComponent } from './components/transactions/transaction-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'transactions', component: TransactionListComponent },
  { path: 'transactions/new', component: TransactionFormComponent },
  { path: 'transactions/edit/:id', component: TransactionFormComponent },
  { path: 'categories', component: CategoriesComponent },
  { path: 'budgets', component: BudgetsComponent },
  { path: 'profile', component: ProfileComponent },
  { path: '**', redirectTo: 'login' },
];
