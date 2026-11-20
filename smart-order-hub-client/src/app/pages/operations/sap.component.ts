import { Component, OnInit, signal } from '@angular/core';
import { SohApiService } from '../../services/soh-api.service';
import { SapTransaction } from '../../models/soh.models';

@Component({
  selector: 'app-sap',
  standalone: false,
  template: `
    <div>
      <p style="font-size:11px; font-weight:600; color:#71717a;">SMART ORDER HUB</p>
      <h1 style="font-size:26px; margin-bottom:16px;">Tích hợp SAP</h1>
      <div class="card">
        <h3 style="margin-bottom:12px;">Theo dõi PO và giao dịch tích hợp</h3>
        <table>
          <thead>
            <tr><th>Hub Order ID / Đối tác</th><th>Phiên bản</th><th>Transaction ID</th><th>Trạng thái</th><th>Kết quả SAP</th><th>SAP Sales Order ID</th><th>Thao tác</th></tr>
          </thead>
          <tbody>
            @for (t of txns(); track t.transaction_id) {
              <tr>
                <td><strong>{{ t.hub_order_id }}</strong><div style="font-size:11px;color:#71717a;">{{ t.customer_name }}</div></td>
                <td>{{ t.po_version }}</td>
                <td>{{ t.transaction_id }}</td>
                <td><span class="badge badge-blue">{{ t.transaction_status }}</span></td>
                <td>{{ t.sap_business_result }}</td>
                <td><strong>{{ t.sap_sales_order_id || 'Chưa có' }}</strong></td>
                <td><button class="btn" (click)="reSimulate(t.po_id)">Gửi lại SAP</button></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class SapComponent implements OnInit {
  txns = signal<SapTransaction[]>([]);
  constructor(private api: SohApiService) {}
  ngOnInit(): void { this.load(); }
  load() { this.api.getSapTransactions().subscribe((res) => this.txns.set(res.items)); }
  reSimulate(poId: string) {
    this.api.simulateSap(poId).subscribe(() => this.load());
  }
}
