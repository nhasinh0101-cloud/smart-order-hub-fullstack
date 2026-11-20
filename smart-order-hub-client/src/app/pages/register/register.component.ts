import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: false,
  template: `
    <div style="display:flex; min-height:100vh;">
      <div style="width:42%; background:#8b1e24; color:#fff; padding:40px 48px; display:flex; flex-direction:column; justify-content:space-between;">
        <div style="font-weight:700; font-size:18px;">📦 smart order</div>
        <div>
          <p style="font-size:11px; letter-spacing:1px; opacity:0.8;">KẾT NỐI ĐỐI TÁC · TIẾP NHẬN ĐƠN HÀNG B2B</p>
          <h1 style="font-size:40px; margin:12px 0;">Mỗi đối tác.</h1>
          <p style="opacity:0.9;">Không gian làm việc thống nhất để quản lý tài khoản, theo dõi đơn hàng và phối hợp hiệu quả.</p>
        </div>
        <div style="font-size:12px; opacity:0.7;">Smart Order Hub</div>
      </div>
      <div style="flex:1; background:#fff; display:flex; align-items:center; justify-content:center; padding:32px;">
        <div style="width:100%; max-width:520px;">
          <p style="font-size:11px; font-weight:600; color:#c92a2a;">TÀI KHOẢN & PHÂN QUYỀN</p>
          <h2 style="font-size:26px; margin-bottom:4px;">Đăng ký đối tác B2B</h2>
          <p style="color:#71717a; font-size:13px; margin-bottom:18px;">Gửi thông tin để người có thẩm quyền xác minh tài khoản.</p>

          @if (message()) {
            <div style="background:#dcfce7; color:#166534; padding:10px; border-radius:8px; margin-bottom:12px;">{{ message() }}</div>
          }

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
            <div>
              <label style="font-size:12px; font-weight:600;">Họ và tên *</label>
              <input class="input-control" [(ngModel)]="form.full_name">
            </div>
            <div>
              <label style="font-size:12px; font-weight:600;">Số điện thoại</label>
              <input class="input-control" [(ngModel)]="form.phone">
            </div>
            <div>
              <label style="font-size:12px; font-weight:600;">Email *</label>
              <input class="input-control" [(ngModel)]="form.email">
            </div>
            <div>
              <label style="font-size:12px; font-weight:600;">Tên đăng nhập *</label>
              <input class="input-control" [(ngModel)]="form.username">
            </div>
            <div>
              <label style="font-size:12px; font-weight:600;">Mật khẩu *</label>
              <input type="password" class="input-control" [(ngModel)]="form.password">
            </div>
            <div>
              <label style="font-size:12px; font-weight:600;">Tên doanh nghiệp *</label>
              <input class="input-control" [(ngModel)]="form.company_name">
            </div>
          </div>

          <div style="margin-bottom:16px;">
            <label style="font-size:12px; font-weight:600;">Mã số thuế / mã doanh nghiệp</label>
            <input class="input-control" [(ngModel)]="form.tax_code">
          </div>

          <button class="btn btn-primary" style="width:100%; justify-content:center; padding:11px;" (click)="submit()">Gửi đăng ký</button>
          <div style="text-align:center; margin-top:14px;">
            <a routerLink="/login" style="color:#71717a; text-decoration:none; font-size:13px;">Đã có tài khoản? Quay lại đăng nhập</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  form = { full_name: '', phone: '', email: '', username: '', password: '', company_name: '', tax_code: '' };
  message = signal<string>('');

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.auth.register(this.form).subscribe({
      next: (res: any) => {
        this.message.set(res.message);
        setTimeout(() => this.router.navigate(['/login']), 1500);
      }
    });
  }
}
