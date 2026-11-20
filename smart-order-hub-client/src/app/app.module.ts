import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
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
import { HelpComponent, SettingsComponent } from './pages/workspace/workspace-pages.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    ShellComponent,
    DashboardComponent,
    OrdersComponent,
    CreatePoComponent,
    ValidationComponent,
    ExceptionsComponent,
    SapComponent,
    InventorySupportComponent,
    ReportsComponent,
    UsersComponent,
    ProfileComponent
    ,AssistantComponent,
    HelpComponent,
    SettingsComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
