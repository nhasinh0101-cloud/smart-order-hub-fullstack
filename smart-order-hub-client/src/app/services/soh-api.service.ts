import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from './auth.service';
import { PurchaseOrder, ExceptionCase, SapTransaction } from '../models/soh.models';

@Injectable({ providedIn: 'root' })
export class SohApiService {
  private readonly BASE = '/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private buildScopeParams(extra: Record<string, string> = {}): HttpParams {
    const u = this.auth.currentUser();
    let params = new HttpParams();
    if (u) {
      params = params.set('role', u.role_code);
      if (u.customer_id) params = params.set('customerId', u.customer_id);
    }
    Object.entries(extra).forEach(([k, v]) => {
      if (v) params = params.set(k, v);
    });
    return params;
  }

  getDashboardSummary() {
    return this.http.get<{ role: string; kpis: any }>(`${this.BASE}/dashboard/summary`, {
      params: this.buildScopeParams()
    });
  }

  getOrders(filters: Record<string, string> = {}) {
    return this.http.get<{ total: number; items: PurchaseOrder[] }>(`${this.BASE}/orders`, {
      params: this.buildScopeParams(filters)
    });
  }

  getOrderDetail(poId: string) {
    return this.http.get<any>(`${this.BASE}/orders/${poId}`);
  }

  getProductCatalog() {
    return this.http.get<{ products: any[]; uoms: any[] }>(`${this.BASE}/orders/catalog/products`);
  }

  createOrder(payload: any) {
    return this.http.post(`${this.BASE}/orders`, payload);
  }

  getExceptions(filters: Record<string, string> = {}) {
    return this.http.get<{ total: number; items: ExceptionCase[] }>(`${this.BASE}/operations/exceptions`, {
      params: this.buildScopeParams(filters)
    });
  }

  resolveException(id: string, action_note: string) {
    const actor = this.auth.currentUser()?.username || 'admin';
    return this.http.post(`${this.BASE}/operations/exceptions/${id}/resolve`, { action_note, actor });
  }

  getSapTransactions() {
    return this.http.get<{ total: number; items: SapTransaction[] }>(`${this.BASE}/operations/sap-transactions`);
  }

  simulateSap(poId: string) {
    return this.http.post(`${this.BASE}/operations/sap-simulate/${poId}`, {});
  }

  getReportLogs() {
    return this.http.get<{ total: number; items: any[] }>(`${this.BASE}/operations/reports/logs`);
  }

  getInventoryOverview() {
    return this.http.get<any>(`${this.BASE}/inventory/overview`, { params: this.buildScopeParams() });
  }

  createInventoryTicket(payload: any) {
    return this.http.post<any>(`${this.BASE}/inventory/tickets`, payload);
  }

  askAssistant(question: string) {
    return this.http.post<any>(`${this.BASE}/assistant/chat`, {
      question,
      customer_id: this.auth.currentUser()?.customer_id || 'CUS001'
    });
  }

  getUsers(filters: Record<string, string> = {}) {
    return this.http.get<{ total: number; items: any[] }>(`${this.BASE}/users`, {
      params: this.buildScopeParams(filters)
    });
  }

  verifyUser(userId: string, status: string, customer_id?: string) {
    return this.http.patch(`${this.BASE}/users/${userId}/verify`, { status, customer_id });
  }
}
