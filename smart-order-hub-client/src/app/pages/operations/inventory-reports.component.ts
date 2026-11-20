import { Component, OnInit, signal } from '@angular/core';
import { SohApiService } from '../../services/soh-api.service';

@Component({
  selector: 'app-inventory-support',
  standalone: false,
  template: `
    <div>
      <p style="font-size:11px; font-weight:600; color:#71717a;">SMART ORDER HUB</p>
      <h1 style="font-size:26px; margin-bottom:6px;">Hỗ trợ tồn kho doanh nghiệp B2B</h1>
      <p style="color:#71717a; margin-bottom:18px;">Theo dõi khả dụng, phát hiện SKU sắp thiếu và gửi yêu cầu bổ sung cho CS/kho.</p>

      <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:12px; margin-bottom:18px;">
        <div class="card"><div class="muted">Tổng SKU</div><strong style="font-size:28px;">{{ summary().total_skus || 0 }}</strong></div>
        <div class="card"><div class="muted">Đủ hàng</div><strong style="font-size:28px; color:#16a34a;">{{ summary().in_stock || 0 }}</strong></div>
        <div class="card"><div class="muted">Sắp thiếu</div><strong style="font-size:28px; color:#d97706;">{{ summary().low_stock || 0 }}</strong></div>
        <div class="card"><div class="muted">Yêu cầu đang mở</div><strong style="font-size:28px; color:#c92a2a;">{{ summary().open_tickets || 0 }}</strong></div>
      </div>

      <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:18px;">
        <div class="card">
          <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
            <h3>Ảnh chụp tồn kho theo SKU</h3><span class="badge badge-gray">{{ stock().length }} SKU</span>
          </div>
          <table>
            <thead><tr><th>SKU</th><th>Sản phẩm</th><th>Khả dụng</th><th>Đã giữ</th><th>Trạng thái</th></tr></thead>
            <tbody>
              @for (item of stock(); track item.sku_code) {
                <tr>
                  <td><strong>{{ item.sku_code }}</strong></td><td>{{ item.product_name }}</td>
                  <td>{{ item.available_quantity | number }} {{ item.base_uom_code }} · {{ item.base_uom_name }}</td><td>{{ item.reserved_quantity | number }}</td>
                  <td><span class="badge" [class.badge-green]="item.tone === 'green'" [class.badge-amber]="item.tone === 'amber'" [class.badge-red]="item.tone === 'red'">{{ item.stock_status_label }}</span></td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="card">
          <h3 style="margin-bottom:12px;">Tạo yêu cầu hỗ trợ</h3>
          <label>SKU cần hỗ trợ</label>
          <select class="select-control" [(ngModel)]="ticket.sku_code">
            <option value="">-- Chọn SKU --</option>
            @for (item of stock(); track item.sku_code) { <option [value]="item.sku_code">{{ item.sku_code }} · {{ item.product_name }}</option> }
          </select>
          <label style="display:block; margin-top:10px;">Loại yêu cầu</label>
          <select class="select-control" [(ngModel)]="ticket.issue_type">
            <option value="LOW_STOCK">Báo sắp thiếu hàng</option><option value="OUT_OF_STOCK">Báo hết hàng</option><option value="REPLENISHMENT">Đề nghị bổ sung hàng</option>
          </select>
          <label style="display:block; margin-top:10px;">Số lượng đề nghị</label>
          <input type="number" class="input-control" [(ngModel)]="ticket.requested_quantity" min="0">
          <label style="display:block; margin-top:10px;">Mô tả</label>
          <textarea class="input-control" [(ngModel)]="ticket.note" rows="4" placeholder="Mô tả tình trạng, thời hạn cần hàng..."></textarea>
          <button class="btn btn-primary" style="margin-top:12px;" (click)="submitTicket()">Gửi yêu cầu cho CS/kho</button>
          @if (message()) { <p style="color:#15803d; margin-top:10px;">{{ message() }}</p> }
        </div>
      </div>

      <div class="card" style="margin-top:18px;">
        <h3 style="margin-bottom:12px;">Yêu cầu gần đây</h3>
        @if (!tickets().length) { <p class="muted">Chưa có yêu cầu tồn kho nào.</p> }
        @for (item of tickets(); track item.ticket_id) {
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid #f0f0f0; padding:10px 0;">
            <span><strong>{{ item.ticket_id }}</strong> · {{ item.sku_code }} · {{ item.note }}</span><span class="badge badge-amber">{{ item.status }}</span>
          </div>
        }
      </div>
    </div>
  `
})
export class InventorySupportComponent implements OnInit {
  summary = signal<any>({});
  stock = signal<any[]>([]);
  tickets = signal<any[]>([]);
  message = signal('');
  ticket: any = { sku_code: '', requested_quantity: 0, issue_type: 'REPLENISHMENT', note: '' };
  constructor(private api: SohApiService) {}
  ngOnInit(): void { this.load(); }
  load() { this.api.getInventoryOverview().subscribe((res) => { this.summary.set(res.summary || {}); this.stock.set(res.stock || []); this.tickets.set(res.tickets || []); }); }
  submitTicket() {
    this.api.createInventoryTicket(this.ticket).subscribe({
      next: (res) => { this.message.set(res.message); this.ticket = { sku_code: '', requested_quantity: 0, issue_type: 'REPLENISHMENT', note: '' }; this.load(); },
      error: (err) => this.message.set(err.error?.message || 'Không thể tạo yêu cầu.')
    });
  }
}

@Component({
  selector: 'app-reports',
  standalone: false,
  template: `
    <div>
      <p style="font-size:11px; font-weight:600; color:#71717a;">SMART ORDER HUB</p>
      <h1 style="font-size:26px; margin-bottom:16px;">Báo cáo & phân tích</h1>
      <div class="card">
        <h3 style="margin-bottom:12px;">Nhật ký xuất báo cáo hệ thống ({{ logs().length }})</h3>
        <table>
          <thead>
            <tr><th>Mã xuất</th><th>Loại báo cáo</th><th>Định dạng</th><th>Người xuất</th><th>Thời điểm</th></tr>
          </thead>
          <tbody>
            @for (l of logs(); track l.export_id) {
              <tr>
                <td>{{ l.export_id }}</td>
                <td>{{ l.report_type }}</td>
                <td><span class="badge badge-gray">{{ l.file_format }}</span></td>
                <td>{{ l.exported_by }}</td>
                <td>{{ l.exported_at }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ReportsComponent implements OnInit {
  logs = signal<any[]>([]);
  constructor(private api: SohApiService) {}
  ngOnInit(): void { this.api.getReportLogs().subscribe((res) => this.logs.set(res.items)); }
}
