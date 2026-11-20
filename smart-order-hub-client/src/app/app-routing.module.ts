import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ShellComponent } from './layout/shell.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { CreatePoComponent } from './pages/create-po/create-po.component';
import { ValidationComponent } from './pages/operations/validation.component';
import { ExceptionsComponent } from './pages/operations/exceptions.component';
import { SapComponent } from './pages/operations/sap.component';
import { InventorySupportComponent, ReportsComponent } from './pages/operations/inventory-reports.component';
import { UsersComponent, ProfileComponent } from './pages/users/users-profile.component';
import { AssistantComponent } from './pages/assistant/assistant.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { HelpComponent, SettingsComponent } from './pages/workspace/workspace-pages.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'app',
    component: ShellComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'orders', component: OrdersComponent },
      { path: 'create-po', component: CreatePoComponent, canActivate: [RoleGuard], data: { roles: ['B2B_CUSTOMER'] } },
      { path: 'validation', component: ValidationComponent, canActivate: [RoleGuard], data: { roles: ['ADMIN', 'CS', 'ORDER_SPECIALIST', 'B2B_CUSTOMER'] } },
      { path: 'exceptions', component: ExceptionsComponent, canActivate: [RoleGuard], data: { roles: ['ADMIN', 'CS', 'SALES_SUPERVISOR', 'ORDER_SPECIALIST', 'SUPERVISOR', 'B2B_CUSTOMER'] } },
      { path: 'sap', component: SapComponent, canActivate: [RoleGuard], data: { roles: ['ADMIN', 'CS', 'INTEGRATION_ENGINEER'] } },
      { path: 'inventory-support', component: InventorySupportComponent },
      { path: 'assistant', component: AssistantComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'users', component: UsersComponent, canActivate: [RoleGuard], data: { roles: ['ADMIN', 'CS'] } },
      { path: 'profile', component: ProfileComponent },
      { path: 'help', component: HelpComponent },
      { path: 'settings', component: SettingsComponent }
    ]
  },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
