import { Component, OnInit, signal } from '@angular/core';
import { SohApiService } from '../../services/soh-api.service';
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
                <td><strong>{{ po.hub_order_id }}</strong><div style="font-size:11px;color:#71717a;">{{ po.customer_po_number }}</div></td>
                <td>{{ po.customer_name }}</td>
                <td>{{ po.current_version }}</td>
                <td>{{ po.intake_channel }}</td>
                <td><span class="badge badge-blue">{{ po.status_name }}</span></td>
                <td><a routerLink="/app/orders" class="btn">Xem kết quả ↗</a></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ValidationComponent implements OnInit {
  orders = signal<PurchaseOrder[]>([]);
  constructor(private api: SohApiService) {}
  ngOnInit(): void { this.api.getOrders().subscribe((res) => this.orders.set(res.items)); }
}
