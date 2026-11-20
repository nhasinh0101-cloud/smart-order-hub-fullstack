import { Component, OnInit, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { SohApiService } from '../../services/soh-api.service';
import { PurchaseOrder } from '../../models/soh.models';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-orders',
  standalone: false,
  template: `
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
        <div>
          <p style="font-size:11px; font-weight:600; color:#71717a;">SMART ORDER HUB</p>
          <h1 style="font-size:26px;">Tra cứu đơn đặt hàng</h1>
        </div>
        @if (auth.roleCode() === 'B2B_CUSTOMER') {
          <a routerLink="/app/create-po" class="btn btn-primary">+ Tạo PO</a>
        }
      </div>

      <div class="card" style="margin-bottom:18px;">
        <div style="display:grid; grid-template-columns:2fr 1fr 1fr auto; gap:12px; align-items:end;">
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Tìm Hub ID / mã PO khách hàng</label>
            <input class="input-control" [ngModel]="search()" (ngModelChange)="search.set($event)" placeholder="Nhập mã đơn hoặc tham chiếu...">
          </div>
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Phương thức nhập</label>
            <select class="select-control" [ngModel]="channel()" (ngModelChange)="channel.set($event)">
              <option value="ALL">Tất cả phương thức</option>
              <option value="PORTAL_FORM">Biểu mẫu trực tiếp</option>
              <option value="EXCEL_UPLOAD">Tải lên Excel/CSV</option>
            </select>
          </div>
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Trạng thái hiện tại</label>
            <select class="select-control" [ngModel]="status()" (ngModelChange)="status.set($event)">
              <option value="ALL">Tất cả trạng thái</option>
              <option value="RECEIVED">Đã tiếp nhận</option>
              <option value="PENDING_CORRECTION">Cần bổ sung thông tin</option>
              <option value="READY_FOR_SAP">Sẵn sàng chuyển SAP</option>
              <option value="VALIDATED">Đã kiểm tra hợp lệ</option>
              <option value="SENT_TO_SAP">Đã gửi SAP</option>
              <option value="SAP_ACCEPTED">SAP đã tạo Sales Order</option>
              <option value="SAP_REJECTED">SAP từ chối xử lý</option>
            </select>
          </div>
          <button class="btn btn-primary" (click)="loadOrders()">Lọc dữ liệu</button>
        </div>
      </div>

      <div class="card">
        <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
          <strong>Danh sách đơn đặt hàng</strong>
          <span class="badge badge-gray">{{ orders().length }} PO</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Hub Order ID</th>
              <th>Mã PO khách hàng</th>
              <th>Đối tác</th>
              <th>Phương thức</th>
              <th>Phiên bản</th>
              <th>Trạng thái xử lý</th>
              <th>SAP Sales Order ID</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            @for (po of orders(); track po.po_id) {
              <tr>
                <td style="font-weight:600; color:#c92a2a;">{{ po.hub_order_id || po.po_id || 'Chưa có mã' }}</td>
                <td>{{ po.customer_po_number || po.customer_reference_po || 'Không có mã tham chiếu' }}</td>
                <td>{{ po.customer_name || po.customer_id || 'Chưa xác định đối tác' }}</td>
                <td>{{ po.intake_channel || 'PORTAL_FORM' }}</td>
                <td><span class="badge badge-gray">{{ po.current_version || 'V1' }}</span></td>
                <td><span class="badge badge-blue">{{ po.status_name || po.current_status_code || 'Chưa xác định' }}</span></td>
                <td>{{ po.sap_sales_order_id || 'Chưa có' }}</td>
                <td><button class="btn" (click)="viewDetail(po.po_id)">Chi tiết ↗</button></td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (selectedDetail()) {
        <div class="card" style="margin-top:18px; border-color:#c92a2a;">
          <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
            <h3>Chi tiết đơn hàng: {{ selectedDetail().po.hub_order_id || selectedDetail().po.po_id }} ({{ selectedDetail().po.customer_po_number || selectedDetail().po.customer_reference_po || 'Không có mã tham chiếu' }})</h3>
            <button class="btn" (click)="selectedDetail.set(null)">Đóng</button>
          </div>
          <p style="font-size:13px; color:#52525b; margin-bottom:10px;">
            Đối tác: <strong>{{ selectedDetail().customer?.customer_name || selectedDetail().po.customer_id || 'Chưa xác định đối tác' }}</strong> · Địa chỉ giao: {{ selectedDetail().po.shipping_address || 'Chưa có địa chỉ nhận hàng' }}
          </p>
          <table>
            <thead>
              <tr><th>Dòng</th><th>Mã SKU</th><th>Tên sản phẩm</th><th>Số lượng</th><th>ĐVT</th><th>Đơn giá</th></tr>
            </thead>
            <tbody>
              @for (it of selectedDetail().items; track it.po_item_id) {
                <tr>
                  <td>{{ it.line_number }}</td>
                  <td>{{ it.customer_sku }}</td>
                  <td>{{ it.product_name }}</td>
                  <td>{{ it.quantity }}</td>
                  <td>{{ it.uom_code }}</td>
                  <td>{{ it.unit_price | number }} đ</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `
})
export class OrdersComponent implements OnInit {
  orders = signal<PurchaseOrder[]>([]);
  search = signal<string>('');
  channel = signal<string>('ALL');
  status = signal<string>('ALL');
  selectedDetail = signal<any>(null);

  constructor(public auth: AuthService, private api: SohApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const query = params.get('search') || '';
      this.search.set(query);
      this.loadOrders();
    });
  }

  loadOrders(): void {
    this.api.getOrders({ search: this.search(), channel: this.channel(), status: this.status() }).subscribe((res) => {
      this.orders.set(res.items);
    });
  }

  viewDetail(poId: string): void {
    this.api.getOrderDetail(poId).subscribe((res) => this.selectedDetail.set(res));
  }
}
