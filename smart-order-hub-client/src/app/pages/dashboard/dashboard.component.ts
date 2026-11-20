import { Component, OnInit, signal, computed } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { SohApiService } from '../../services/soh-api.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  styles: ['.po-card { color: inherit; text-decoration: none; } .po-card:hover { border-color: #c92a2a; }'],
  template: `
    <div>
      <p style="font-size:11px; font-weight:600; color:#71717a;">NHỊP VẬN HÀNH MỖI NGÀY</p>
      <h1 style="font-size:26px; margin:4px 0;">{{ pageTitle() }}</h1>
      <p style="color:#71717a; margin-bottom:18px;">Chào {{ auth.currentUser()?.full_name }}, theo dõi tình hình tiếp nhận và xử lý đơn hàng.</p>

      <div style="background:#fdf2f2; border:1px solid #fecaca; border-radius:12px; padding:22px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <span style="font-size:11px; font-weight:700; color:#c92a2a;">● GÓC NHÌN ORDER INTAKE</span>
          <h2 style="font-size:20px; margin:6px 0;">Đơn hàng rõ ràng. Kết quả có căn cứ.</h2>
          <p style="font-size:13px; color:#52525b; margin-bottom:14px;">Theo dõi đúng PO, đúng phiên bản và đúng phạm vi được cấp. Technical ACK không đồng nghĩa SAP đã tạo Sales Order.</p>
          <div style="display:flex; gap:10px;">
            <a routerLink="/app/orders" class="btn">→ Tra cứu đơn đặt hàng</a>
            @if (auth.roleCode() === 'B2B_CUSTOMER') {
              <a routerLink="/app/create-po" class="btn btn-primary">+ Tạo PO mới</a>
            }
          </div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:16px;">
        <a routerLink="/app/orders" class="card po-card">
          <div style="font-size:12px; color:#71717a;">Tổng PO đã tiếp nhận</div>
          <div style="font-size:30px; font-weight:700; margin:8px 0;">{{ kpis().total_po || 0 }}</div>
          <div style="font-size:12px; color:#a1a1aa;">Theo phạm vi tài khoản</div>
        </a>
        <a routerLink="/app/orders" [queryParams]="{ category: 'processing_po' }" class="card po-card">
          <div style="font-size:12px; color:#71717a;">PO đang xử lý</div>
          <div style="font-size:30px; font-weight:700; margin:8px 0;">{{ kpis().processing_po || 0 }}</div>
          <div style="font-size:12px; color:#a1a1aa;">Tiếp nhận hoặc đang kiểm tra</div>
        </a>
        <a routerLink="/app/orders" [queryParams]="{ category: 'need_info_po' }" class="card po-card">
          <div style="font-size:12px; color:#71717a;">Cần bổ sung thông tin</div>
          <div style="font-size:30px; font-weight:700; margin:8px 0; color:#d97706;">{{ kpis().need_info_po || 0 }}</div>
          <div style="font-size:12px; color:#a1a1aa;">Trạng thái hiện tại có căn cứ</div>
        </a>
        <a routerLink="/app/orders" [queryParams]="{ category: 'ready_sap_po' }" class="card po-card">
          <div style="font-size:12px; color:#71717a;">Sẵn sàng chuyển SAP</div>
          <div style="font-size:30px; font-weight:700; margin:8px 0; color:#16a34a;">{{ kpis().ready_sap_po || 0 }}</div>
          <div style="font-size:12px; color:#a1a1aa;">Đã đạt Validation</div>
        </a>
        <a routerLink="/app/orders" [queryParams]="{ category: 'sent_sap_po' }" class="card po-card">
          <div style="font-size:12px; color:#71717a;">Đã gửi · Chờ kết quả SAP</div>
          <div style="font-size:30px; font-weight:700; margin:8px 0;">{{ kpis().sent_sap_po || 0 }}</div>
        </a>
        <a routerLink="/app/orders" [queryParams]="{ category: 'sap_success_po' }" class="card po-card">
          <div style="font-size:12px; color:#71717a;">SAP đã tạo Sales Order</div>
          <div style="font-size:30px; font-weight:700; margin:8px 0; color:#16a34a;">{{ kpis().sap_success_po || 0 }}</div>
        </a>
        <a routerLink="/app/orders" [queryParams]="{ category: 'sap_rejected_po' }" class="card po-card">
          <div style="font-size:12px; color:#71717a;">SAP từ chối xử lý</div>
          <div style="font-size:30px; font-weight:700; margin:8px 0; color:#dc2626;">{{ kpis().sap_rejected_po || 0 }}</div>
        </a>
        <a routerLink="/app/exceptions" class="card" style="text-decoration:none; color:inherit; cursor:pointer;">
          <div style="font-size:12px; color:#71717a;">Ngoại lệ đang mở</div>
          <div style="font-size:30px; font-weight:700; margin:8px 0; color:#c92a2a;">{{ kpis().open_exceptions || 0 }}</div>
          <div style="font-size:12px; color:#c92a2a;">Bấm để xem chi tiết →</div>
        </a>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  kpis = signal<any>({});
  pageTitle = computed(() => {
    const r = this.auth.roleCode();
    if (r === 'B2B_CUSTOMER') return 'Tổng quan đơn đặt hàng';
    if (r === 'CS') return 'Tổng quan vận hành';
    if (r === 'SALES_SUPERVISOR') return 'Tổng quan khu vực';
    return 'Tổng quan không gian';
  });

  constructor(public auth: AuthService, private api: SohApiService) {}

  ngOnInit(): void {
    this.api.getDashboardSummary().subscribe((res) => this.kpis.set(res.kpis));
  }
}
