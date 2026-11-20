import { Component, OnInit, signal } from '@angular/core';
import { SohApiService } from '../../services/soh-api.service';
import { finalize } from 'rxjs';
import { PurchaseOrder } from '../../models/soh.models';

@Component({
  selector: 'app-validation',
  standalone: false,
  template: `
    <div>
      <p style="font-size:11px; font-weight:600; color:#71717a;">SMART ORDER HUB</p>
      <h1 style="font-size:26px; margin-bottom:16px;">Kiểm tra và ánh xạ PO</h1>
      <div class="card">
        <h3 style="margin-bottom:12px;">Danh sách PO kiểm tra ({{ orders().length }})</h3>
        <table>
          <thead>
            <tr><th>Mã đơn hàng Hub</th><th>Đối tác</th><th>Phiên bản</th><th>Phương thức</th><th>Trạng thái</th><th>Thao tác</th></tr>
          </thead>
          <tbody>
            @for (po of orders(); track po.po_id) {
              <tr>
                <td>
                  <a routerLink="/app/orders" [queryParams]="{ search: po.hub_order_id || po.po_id, po: po.po_id }">
                    {{ po.hub_order_id || po.po_id }}
                  </a>
                  <div style="font-size:11px;color:#71717a;">{{ po.customer_po_number }}</div>
                </td>
                <td>{{ po.customer_name }}</td>
                <td>{{ po.current_version }}</td>
                <td>{{ po.intake_channel }}</td>
                <td><span class="badge badge-blue">{{ po.status_name }}</span></td>
                <td><button class="btn" [disabled]="loading()" (click)="viewResult(po)">Xem kết quả</button></td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (loading()) { <p role="status">Đang tải kết quả kiểm tra...</p> }
      @if (error()) { <p role="alert">{{ error() }}</p> }
      @if (result(); as detail) {
        <section class="card" style="margin-top:18px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h3>Kết quả kiểm tra PO {{ detail.po.hub_order_id || detail.po.po_id }}</h3>
            <button class="btn" (click)="result.set(null)">Đóng</button>
          </div>
          <p>Trạng thái: <strong>{{ selectedOrder()?.status_name || detail.po.current_status_code }}</strong></p>
          @if (detail.items.length) {
            <table>
              <thead><tr><th>Dòng</th><th>Mã trên PO</th><th>SKU ánh xạ</th><th>Số lượng</th><th>ĐVT</th></tr></thead>
              <tbody>
                @for (item of detail.items; track item.po_item_id) {
                  <tr>
                    <td>{{ item.line_number }}</td>
                    <td>{{ item.customer_sku || item.customer_product_code || '—' }}</td>
                    <td>{{ item.mapped_sku || 'Chưa ánh xạ' }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>{{ item.uom_code || 'Chưa xác định' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <p>Chưa có dòng hàng để hiển thị.</p>
          }
          @if (detail.exceptions.length) {
            <h4 style="margin-top:12px;">Ngoại lệ đã ghi nhận</h4>
            <ul>
              @for (issue of detail.exceptions; track issue.exception_id) {
                <li>{{ issue.description || issue.exception_description }} ({{ issue.status || issue.exception_status }})</li>
              }
            </ul>
          }
        </section>
      }
    </div>
  `
})
export class ValidationComponent implements OnInit {
  orders = signal<PurchaseOrder[]>([]);
  selectedOrder = signal<PurchaseOrder | null>(null);
  result = signal<any>(null);
  loading = signal(false);
  error = signal('');
  constructor(private api: SohApiService) {}
  ngOnInit(): void {
    this.api.getOrders().subscribe({
      next: (res) => this.orders.set(res.items),
      error: () => this.error.set('Không tải được danh sách PO.')
    });
  }

  viewResult(po: PurchaseOrder): void {
    this.selectedOrder.set(po);
    this.result.set(null);
    this.error.set('');
    this.loading.set(true);
    this.api.getOrderDetail(po.po_id).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (detail) => {
        const version = detail.versions.find((version: { version_no?: string; version_number?: number }) =>
          (version.version_no || 'V' + version.version_number) === detail.po.current_version
        ) ?? detail.versions[0];
        const items = version
          ? detail.items.filter((item: { version_id?: string }) => !item.version_id || item.version_id === version.version_id)
          : detail.items;
        this.result.set({ ...detail, items });
      },
      error: () => this.error.set('Không tải được kết quả kiểm tra PO.')
    });
  }
}
