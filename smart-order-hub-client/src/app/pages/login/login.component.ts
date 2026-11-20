import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserSession } from '../../models/soh.models';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  demoAccounts = signal<UserSession[]>([]);
  identifier = signal<string>('minh.tran@example.com');
  password = signal<string>('Demo@12345');
  errorMsg = signal<string>('');
  loading = signal<boolean>(false);

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.auth.getDemoAccounts().subscribe({
      next: (list) => this.demoAccounts.set(list),
      error: () => {
        this.demoAccounts.set([
          { user_id: 'DEMO-CS', username: 'linh.nguyen', email: 'linh.nguyen@example.com', full_name: 'Nguyễn Ngọc Linh', phone: '0901234001', role_code: 'CS', role_name: 'Chăm sóc khách hàng', company_name: 'Smart Order Hub', partner_type: 'Nội bộ', status: 'ACTIVE', can_submit_po: false },
          { user_id: 'DEMO-B2B', username: 'minh.tran', email: 'minh.tran@example.com', full_name: 'Trần Nhật Minh', phone: '0901234002', role_code: 'B2B_CUSTOMER', role_name: 'Khách hàng B2B', company_name: 'An Phu Distribution', customer_id: 'CUS001', partner_type: 'An Phu Distribution', sap_customer_id: '0010000120', status: 'ACTIVE', can_submit_po: true },
          { user_id: 'DEMO-ADMIN', username: 'alex.le', email: 'alex.le@example.com', full_name: 'Lê Minh An', phone: '0901234003', role_code: 'ADMIN', role_name: 'Quản trị viên', company_name: 'Smart Order Hub', partner_type: 'Nội bộ', status: 'ACTIVE', can_submit_po: false },
          { user_id: 'DEMO-SUPERVISOR', username: 'anh.pham', email: 'anh.pham@example.com', full_name: 'Phạm Quỳnh Anh', phone: '0901234004', role_code: 'SALES_SUPERVISOR', role_name: 'Giám sát kinh doanh', company_name: 'Smart Order Hub', partner_type: 'Nội bộ', status: 'ACTIVE', can_submit_po: false }
        ]);
      }
    });
  }

  selectDemo(acc: UserSession): void {
    this.identifier.set(acc.email);
    this.password.set('Demo@12345');
  }

  submitLogin(): void {
    this.errorMsg.set('');
    this.loading.set(true);
    this.auth.login(this.identifier(), this.password()).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/app/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Đăng nhập thất bại. Kiểm tra Backend port 3000.');
      }
    });
  }
}
