import { Component, OnInit, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { SohApiService } from '../../services/soh-api.service';

@Component({
  selector: 'app-users',
  standalone: false,
  template: `
    <div>
      <p style="font-size:11px; font-weight:600; color:#71717a;">SMART ORDER HUB</p>
      <h1 style="font-size:26px; margin-bottom:16px;">Quản lý người dùng</h1>
      <div class="card">
        <table>
          <thead>
            <tr><th>Người dùng</th><th>Vai trò</th><th>Doanh nghiệp</th><th>Trạng thái</th><th>Liên kết SAP</th><th>Thao tác</th></tr>
          </thead>
          <tbody>
            @for (u of users(); track u.user_id) {
              <tr>
                <td><strong>{{ u.full_name }}</strong><div style="font-size:11px;color:#71717a;">{{ u.email }}</div></td>
                <td>{{ u.role_name }}</td>
                <td>{{ u.company_name }}</td>
                <td><span class="badge" [class.badge-green]="u.status === 'ACTIVE'" [class.badge-amber]="u.status !== 'ACTIVE'">{{ u.status }}</span></td>
                <td>{{ u.sap_customer_id || 'Không áp dụng' }}</td>
                <td>
                  @if (u.status === 'PENDING') {
                    <button class="btn btn-primary" (click)="approve(u.user_id)">Duyệt kích hoạt</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class UsersComponent implements OnInit {
  users = signal<any[]>([]);
  constructor(private api: SohApiService) {}
  ngOnInit(): void { this.load(); }
  load() { this.api.getUsers().subscribe((res) => this.users.set(res.items)); }
  approve(userId: string) {
    this.api.verifyUser(userId, 'ACTIVE', 'CUS001').subscribe(() => this.load());
  }
}

@Component({
  selector: 'app-profile',
  standalone: false,
  template: `
    <div>
      <p style="font-size:11px; font-weight:600; color:#71717a;">SMART ORDER HUB</p>
      <h1 style="font-size:26px; margin-bottom:16px;">Hồ sơ của tôi</h1>
      <div style="display:grid; grid-template-columns:1.4fr 1fr; gap:18px;">
        <div class="card">
          <h3 style="margin-bottom:14px;">Thông tin cá nhân</h3>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div><label style="font-size:12px;color:#71717a;">Họ và tên</label><input class="input-control" [value]="auth.currentUser()?.full_name" readonly></div>
            <div><label style="font-size:12px;color:#71717a;">Số điện thoại</label><input class="input-control" [value]="auth.currentUser()?.phone" readonly></div>
            <div><label style="font-size:12px;color:#71717a;">Email</label><input class="input-control" [value]="auth.currentUser()?.email" readonly></div>
            <div><label style="font-size:12px;color:#71717a;">Tên đăng nhập</label><input class="input-control" [value]="auth.currentUser()?.username" readonly></div>
          </div>
        </div>
        <div class="card">
          <h3 style="margin-bottom:14px;">Đối tác & quyền truy cập</h3>
          <p style="margin-bottom:8px;">Trạng thái: <span class="badge badge-green">Đang hoạt động</span></p>
          <p style="margin-bottom:8px;">Vai trò được gán: <strong>{{ auth.currentUser()?.role_name }}</strong></p>
          <p style="margin-bottom:8px;">Doanh nghiệp khai báo: <strong>{{ auth.currentUser()?.company_name }}</strong></p>
          <p style="margin-bottom:8px;">SAP Customer ID: <strong>{{ auth.currentUser()?.sap_customer_id || 'Không có' }}</strong></p>
          <p>Quyền gửi PO: <strong>{{ auth.currentUser()?.can_submit_po ? 'Đủ điều kiện tài khoản' : 'Không áp dụng' }}</strong></p>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent {
  constructor(public auth: AuthService) {}
}
