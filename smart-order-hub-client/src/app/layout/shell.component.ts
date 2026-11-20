import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: false,
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.css']
})
export class ShellComponent {
  user = computed(() => this.auth.currentUser());
  role = computed(() => this.auth.roleCode());

  canCreatePO = computed(() => this.role() === 'B2B_CUSTOMER');
  canValidatePO = computed(() => ['ADMIN', 'CS', 'ORDER_SPECIALIST', 'B2B_CUSTOMER'].includes(this.role()));
  canHandleExceptions = computed(() => ['ADMIN', 'CS', 'SALES_SUPERVISOR', 'ORDER_SPECIALIST', 'SUPERVISOR'].includes(this.role()));
  canViewSap = computed(() => ['ADMIN', 'CS', 'INTEGRATION_ENGINEER'].includes(this.role()));
  canManageUsers = computed(() => ['ADMIN', 'CS'].includes(this.role()));
  canViewAssistant = computed(() => ['ADMIN', 'CS', 'B2B_CUSTOMER'].includes(this.role()));
  globalSearch = signal('');

  constructor(public auth: AuthService, private router: Router) {}

  pageLabel(): string {
    const segment = this.router.url.split('?')[0].split('/').filter(Boolean).pop() || 'dashboard';
    const labels: Record<string, string> = {
      dashboard: 'Tổng quan', orders: 'Tra cứu đơn đặt hàng', 'create-po': 'Tạo đơn đặt hàng (PO)',
      validation: 'Kiểm tra và ánh xạ PO', exceptions: 'Danh sách ngoại lệ PO', sap: 'Tích hợp SAP',
      'inventory-support': 'Hỗ trợ tồn kho tại đại lý', assistant: 'Trợ lý AI nghiệp vụ',
      reports: 'Báo cáo & phân tích', users: 'Quản lý người dùng', profile: 'Hồ sơ của tôi',
      help: 'Trợ giúp & tài liệu', settings: 'Cài đặt không gian'
    };
    return labels[segment] || 'Không gian SOH';
  }

  submitSearch(): void {
    const term = this.globalSearch().trim();
    if (term) this.router.navigate(['/app/orders'], { queryParams: { search: term } });
  }
}
