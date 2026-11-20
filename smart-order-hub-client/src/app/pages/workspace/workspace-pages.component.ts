import { Component, signal } from '@angular/core';

@Component({ selector: 'app-help', standalone: false, template: `
  <div class="workspace-page">
    <p class="eyebrow">SMART ORDER HUB</p><h1>Trợ giúp & tài liệu</h1><p class="page-subtitle">Thông tin cần thiết để trải nghiệm Smart Order Hub.</p>
    <div class="help-hero"><div class="help-icon"><svg viewBox="0 0 24 24"><path d="M5 5h14v14H5z"/><path d="M8 9h8M8 13h5"/></svg></div><h2>Khám phá không gian làm việc</h2><p>Trải nghiệm nền tảng tiếp nhận đơn hàng B2B rõ ràng và thống nhất.</p></div>
    <div class="help-grid">
      <div class="card"><div class="tile-icon"><svg viewBox="0 0 24 24"><path d="m5 12 14-7-7 14-2-5-5-2Z"/></svg></div><h3>Khám phá không gian làm việc</h3><p>Sử dụng thanh bên để mở các mô-đun tài khoản, tiếp nhận PO, Validation, tích hợp SAP, báo cáo và hỗ trợ tồn kho.</p></div>
      <div class="card"><div class="tile-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3"/><path d="M5 20c.5-4 3-6 7-6s6.5 2 7 6"/></svg></div><h3>Thử góc nhìn khác</h3><p>Mở menu tài khoản để chọn vai trò demo khác nhằm xem đúng phạm vi quyền truy cập.</p></div>
      <div class="card"><div class="tile-icon"><svg viewBox="0 0 24 24"><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg></div><h3>Hiểu dữ liệu mô phỏng</h3><p>Dữ liệu hiển thị phục vụ kiểm thử luồng nghiệp vụ, không đại diện cho dữ liệu SAP thật.</p></div>
      <div class="card"><div class="tile-icon"><svg viewBox="0 0 24 24"><path d="M12 3 20 7v5c0 4.5-3.2 7.5-8 9-4.8-1.5-8-4.5-8-9V7l8-4Z"/><path d="m9 12 2 2 4-4"/></svg></div><h3>Nắm rõ phạm vi</h3><p>SOH kiểm tra, chuẩn hóa, mapping và lưu vết PO; SAP chỉ được mô phỏng trong môi trường demo.</p></div>
    </div>
    <div class="card help-note"><strong>Smart Order Hub · Bản mẫu sử dụng</strong><span>Dành cho trình diễn và bàn giao phát triển. Mọi dữ liệu hiện tại đều được mô phỏng.</span></div>
  </div>
` })
export class HelpComponent {}

@Component({ selector: 'app-settings', standalone: false, template: `
  <div class="workspace-page">
    <p class="eyebrow">SMART ORDER HUB</p><h1>Cài đặt không gian</h1><p class="page-subtitle">Tùy chỉnh trải nghiệm trong không gian mô phỏng.</p>
    <div class="settings-grid">
      <div class="card settings-list"><div class="settings-title"><strong>Tùy chọn không gian</strong><span class="settings-icon"><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="11" cy="17" r="2"/></svg></span></div>
        <div class="setting-row"><div><strong>Bảng dữ liệu thu gọn</strong><small>Hiển thị thêm thông tin trong bảng đơn hàng.</small></div><button class="toggle" [class.on]="compact()" (click)="toggleCompact()"><span></span></button></div>
        <div class="setting-row"><div><strong>Tài khoản demo</strong><small>Chọn danh tính mô phỏng khác, không thay đổi vai trò được gán.</small></div><button class="btn" routerLink="/login">Mở đăng nhập demo</button></div>
        <div class="setting-row"><div><strong>Đặt lại giao diện</strong><small>Khôi phục bộ lọc, thông báo và mật độ bảng.</small></div><button class="btn" (click)="reset()">Đặt lại</button></div>
      </div>
      <div class="card demo-card"><div class="tile-icon"><svg viewBox="0 0 24 24"><path d="M8 4h8M9 4v4l-4 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-4-9V4"/><path d="M8 14h8"/></svg></div><h3>Bản mẫu dành cho trải nghiệm.</h3><p>Smart Order Hub là bản mẫu UI/UX. Không có backend, cơ sở dữ liệu, xác thực thay thế kết nối SAP thật.</p><span class="badge badge-amber">• Demo Mode</span></div>
    </div>
  </div>
` })
export class SettingsComponent { compact = signal(false); toggleCompact() { this.compact.update((value) => !value); } reset() { this.compact.set(false); } }
