import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { UserSession } from '../models/soh.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = '/api/auth';
  private readonly STORAGE_KEY = 'soh_current_user';

  currentUser = signal<UserSession | null>(this.loadStoredUser());
  isLoggedIn = computed(() => this.currentUser() !== null);
  roleCode = computed(() => this.currentUser()?.role_code || 'B2B_CUSTOMER');

  constructor(private http: HttpClient, private router: Router) {}

  private loadStoredUser(): UserSession | null {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  getDemoAccounts() {
    return this.http.get<UserSession[]>(`${this.API_URL}/demo-accounts`);
  }

  login(identifier: string, password: string) {
    return this.http.post<{ user: UserSession; token: string }>(`${this.API_URL}/login`, { identifier, password }).pipe(
      tap((res) => {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(res.user));
        this.currentUser.set(res.user);
      })
    );
  }

  register(payload: any) {
    return this.http.post(`${this.API_URL}/register`, payload);
  }

  logout() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
