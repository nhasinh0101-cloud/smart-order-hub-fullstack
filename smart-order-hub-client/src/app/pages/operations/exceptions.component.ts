import { Component, OnInit, signal } from '@angular/core';
import { SohApiService } from '../../services/soh-api.service';
import { ExceptionCase } from '../../models/soh.models';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-exceptions',
  standalone: false,
  template: `
    <div>
      <p style="font-size:11px; font-weight:600; color:#71717a;">SMART ORDER HUB</p>
      <h1 style="font-size:26px; margin-bottom:6px;">{{ auth.roleCode() === 'B2B_CUSTOMER' ? 'Cập nhật ngoại lệ PO' : 'Danh sách ngoại lệ PO' }}</h1>
      <p style="color:#71717a; margin:0 0 16px;">{{ auth.roleCode() === 'B2B_CUSTOMER' ? 'Theo dõi các cập nhật liên quan đến PO trong phạm vi doanh nghiệp.' : 'Theo dõi ngoại lệ, phiên bản PO và kết quả xử lý theo đúng quy trình.' }}</p>
      @if (auth.roleCode() !== 'B2B_CUSTOMER') {
        <div class="card" style="margin-bottom:16px; padding:14px 18px; background:#fffaf0; border:1px solid #f5d48a;">
          <strong>Phối hợp xử lý ngoại lệ:</strong> Quy tắc được hệ thống áp dụng tự động; nhân sự chỉ xác minh kết quả, phân công và ghi nhận sau khi kiểm tra lại.
        </div>
      } @else {
        <div class="card" style="margin-bottom:16px; padding:14px 18px; background:#f5f9ff; border:1px solid #c8ddf7;">
          Bạn chỉ xem được thông tin cập nhật của PO. Hệ thống tự phân loại và xử lý ngoại lệ ở phía vận hành.
        </div>
      }
      <div class="card">
        <table>
          <thead>
            @if (auth.roleCode() === 'B2B_CUSTOMER') {
              <tr><th>Mã ngoại lệ / PO</th><th>Thông tin cập nhật</th><th>Mức độ</th><th>Trạng thái</th><th>Thời điểm</th></tr>
            } @else {
              <tr><th>Mã ngoại lệ / PO</th><th>Giai đoạn</th><th>Nguyên nhân</th><th>Mức độ</th><th>Phụ trách</th><th>Trạng thái</th><th></th></tr>
            }
          </thead>
          <tbody>
            @for (ex of exceptions(); track ex.exception_id) {
              <tr>
                <td><strong>{{ ex.exception_id }}</strong><div style="font-size:11px;color:#71717a;">{{ ex.hub_order_id }}</div></td>
                @if (auth.roleCode() === 'B2B_CUSTOMER') {
                  <td><strong>{{ ex.error_code }}</strong><div style="font-size:11px;color:#71717a;">{{ ex.description }}</div><div style="font-size:12px;margin-top:5px;">{{ ex.customer_update }}</div></td>
                  <td><span class="badge" [class.badge-red]="ex.severity === 'HIGH'" [class.badge-amber]="ex.severity !== 'HIGH'">{{ ex.severity }}</span></td>
                  <td><span class="badge" [class.badge-green]="ex.status === 'RESOLVED'" [class.badge-amber]="ex.status !== 'RESOLVED'">{{ ex.status }}</span></td>
                  <td>{{ ex.resolved_at || ex.detected_at }}</td>
                } @else {
                  <td><span class="badge badge-amber">{{ ex.stage_label }}</span></td>
                  <td><strong>{{ ex.error_code }}</strong><div style="font-size:11px;color:#71717a;">{{ ex.description }}</div></td>
                  <td><span class="badge" [class.badge-red]="ex.severity === 'HIGH'" [class.badge-amber]="ex.severity !== 'HIGH'">{{ ex.severity }}</span></td>
                  <td>{{ ex.assigned_department || 'CS' }}</td>
                  <td><span class="badge" [class.badge-green]="ex.status === 'RESOLVED'" [class.badge-amber]="ex.status !== 'RESOLVED'">{{ ex.status }}</span>@if (ex.is_blocking) { <div style="font-size:11px;color:#b42318;margin-top:4px;">Đang chặn PO</div> }</td>
                }
                @if (auth.roleCode() !== 'B2B_CUSTOMER') {
                  <td><button class="btn" (click)="toggle(ex.exception_id)">{{ expandedId() === ex.exception_id ? 'Thu gọn' : 'Chi tiết' }}</button></td>
                }
              </tr>
              @if (auth.roleCode() !== 'B2B_CUSTOMER' && expandedId() === ex.exception_id) {
                <tr>
                  <td [attr.colspan]="auth.roleCode() === 'B2B_CUSTOMER' ? 6 : 7" style="background:#fafafa; padding:16px 20px;">
                    @if (auth.roleCode() === 'B2B_CUSTOMER') {
                      <div><small>Cập nhật hệ thống</small><div><strong>{{ ex.customer_update }}</strong></div></div>
                    } @else {
                    <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;">
                      <div><small>Hành động cần làm</small><div><strong>{{ ex.action_required }}</strong></div></div>
                      <div><small>PO Version</small><div>{{ ex.po_version || 'Chưa ghi nhận' }}</div></div>
                      <div><small>Integration Transaction ID</small><div>{{ ex.integration_transaction_id || 'Chưa ghi nhận' }}</div></div>
                    </div>
                    @if (ex.status !== 'RESOLVED') {
                      <button class="btn btn-primary" style="margin-top:14px;" (click)="resolve(ex.exception_id)">Xác nhận đã khắc phục và kiểm tra lại</button>
                    } @else {
                      <div style="margin-top:14px;color:#087443;">Ngoại lệ đã được đóng sau xử lý.</div>
                    }
                    }
                  </td>
                </tr>
              }
            }
            @if (exceptions().length === 0) { <tr><td [attr.colspan]="auth.roleCode() === 'B2B_CUSTOMER' ? 5 : 7" style="text-align:center;padding:28px;color:#71717a;">Không có ngoại lệ thuộc phạm vi của tài khoản.</td></tr> }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ExceptionsComponent implements OnInit {
  exceptions = signal<ExceptionCase[]>([]);
  expandedId = signal<string | null>(null);
  constructor(private api: SohApiService, public auth: AuthService) {}
  ngOnInit(): void { this.load(); }
  load() { this.api.getExceptions().subscribe((res) => this.exceptions.set(res.items)); }
  toggle(id: string) { this.expandedId.update((current) => current === id ? null : id); }
  resolve(id: string) {
    this.api.resolveException(id, 'Đã khắc phục nguyên nhân, chạy lại kiểm tra và xác nhận PO được phép đi tiếp').subscribe(() => this.load());
  }
}
