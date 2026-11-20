import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SohApiService } from '../../services/soh-api.service';
import * as XLSX from 'xlsx';

interface PoLine {
  sku: string;
  product_name: string;
  quantity: number;
  uom_code: string;
  unit_price: number | null;
}

@Component({
  selector: 'app-create-po',
  standalone: false,
  template: `
    <div>
      <p style="font-size:11px; font-weight:600; color:#71717a;">SMART ORDER HUB</p>
      <h1 style="font-size:26px; margin-bottom:16px;">Tạo đơn đặt hàng (PO)</h1>

      <div class="card" style="margin-bottom:18px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:11px; color:#71717a;">ĐỐI TÁC ĐANG ĐẶT HÀNG</div>
          <strong style="font-size:16px;">{{ auth.currentUser()?.company_name }}</strong>
          <div style="font-size:12px; color:#71717a;">SAP Customer ID: {{ auth.currentUser()?.sap_customer_id || '0010000120' }}</div>
        </div>
          <span class="badge" [class.badge-green]="canSubmit" [class.badge-amber]="!canSubmit">
            ● {{ canSubmit ? 'Đang hoạt động · Được phép đặt hàng' : 'Chưa đủ điều kiện đặt hàng' }}
          </span>
      </div>

      <div class="card">
        <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:10px; padding:14px; margin-bottom:16px;">
          <h3 style="margin-bottom:6px;">Tải mẫu hoặc import PO</h3>
          <p style="font-size:12px; color:#52525b; margin-bottom:10px;">Tải mẫu PO chuẩn, điền thông tin rồi upload lại để hệ thống tự động điền form và kiểm tra SKU/UOM.</p>
          <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
            <button class="btn" (click)="downloadTemplate()">↓ Tải mẫu PO</button>
            <label class="btn btn-primary" style="cursor:pointer;">
              ↑ Chọn file PO
              <input type="file" accept=".xlsx,.xls,.csv" (change)="importFile($event)" style="display:none;">
            </label>
          </div>
          @if (importMessage) { <p style="font-size:12px; color:#166534; margin-top:10px;">{{ importMessage }}</p> }
        </div>
        <h3 style="margin-bottom:14px;">Nhập PO trực tiếp qua B2B Portal</h3>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:16px;">
          <div>
            <label style="font-size:12px; font-weight:600;">Mã PO tham chiếu (không bắt buộc)</label>
            <input class="input-control" [(ngModel)]="customerPoNumber" placeholder="Không bắt buộc theo quy tắc nghiệp vụ">
          </div>
          <div>
            <label style="font-size:12px; font-weight:600;">Ngày giao mong muốn</label>
            <input type="date" class="input-control" [(ngModel)]="deliveryDate">
          </div>
          <div>
            <label style="font-size:12px; font-weight:600;">Địa chỉ nhận hàng</label>
            <input class="input-control" [(ngModel)]="shippingAddress">
          </div>
        </div>

        <div style="margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <strong>Danh sách mặt hàng đặt mua</strong>
            <button class="btn" (click)="addLine()">+ Thêm dòng sản phẩm</button>
          </div>
          <table>
            <thead>
              <tr><th>Mã SKU</th><th>Tên sản phẩm</th><th>Số lượng</th><th>ĐVT</th><th>Đơn giá (VND)</th><th></th></tr>
            </thead>
            <tbody>
              @for (line of lines; track $index) {
                <tr>
                  <td>
                    <select class="select-control" [(ngModel)]="line.sku" (ngModelChange)="syncProduct(line)">
                      <option value="">-- Chọn SKU --</option>
                      @for (product of products; track product.sku_code) {
                        <option [value]="product.sku_code">{{ product.sku_code }} - {{ product.product_name }}</option>
                      }
                    </select>
                  </td>
                  <td><input class="input-control" [(ngModel)]="line.product_name" placeholder="Tên hàng hóa" readonly></td>
                  <td><input type="number" class="input-control" [(ngModel)]="line.quantity"></td>
                  <td>
                    <select class="select-control" [(ngModel)]="line.uom_code">
                      @for (uom of uoms; track uom.uom_code) {
                        <option [value]="uom.uom_code">{{ uom.uom_code }} - {{ uom.uom_name }}</option>
                      }
                    </select>
                  </td>
                  <td><input type="number" min="0" step="any" class="input-control" [(ngModel)]="line.unit_price" [attr.aria-label]="'Đơn giá dòng ' + ($index + 1)"></td>
                  <td><button class="btn" (click)="removeLine($index)">Xóa</button></td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <button class="btn btn-primary" [disabled]="!canSubmit" (click)="submitPo()">Xác nhận gửi PO lên Smart Order Hub</button>
      </div>
    </div>
  `
})
export class CreatePoComponent implements OnInit {
  customerPoNumber = 'PO-ANPHU-2026-99';
  deliveryDate = '2026-11-25';
  shippingAddress = 'Kho trung tâm An Phú, TP. Hồ Chí Minh';
  lines: PoLine[] = [
    { sku: 'SKU-10007', product_name: '', quantity: 50, uom_code: 'EA', unit_price: null }
  ];
  products: any[] = [];
  uoms: any[] = [
    { uom_code: 'EA', uom_name: 'Cái/đơn vị' },
    { uom_code: 'CS', uom_name: 'Thùng nhỏ' },
    { uom_code: 'BOX', uom_name: 'Hộp' },
    { uom_code: 'CTN', uom_name: 'Thùng carton' },
    { uom_code: 'PCK', uom_name: 'Gói' }
  ];

  canSubmit = false;
  importMessage = '';

  constructor(public auth: AuthService, private api: SohApiService, private router: Router) {}
  ngOnInit(): void {
    const user = this.auth.currentUser();
    this.canSubmit = this.auth.roleCode() === 'B2B_CUSTOMER' && Boolean(user?.customer_id && user?.sap_customer_id);
    this.api.getProductCatalog().subscribe({
      next: (catalog) => {
        this.products = catalog.products || [];
        if (catalog.uoms?.length) this.uoms = catalog.uoms;
        this.lines.forEach((line) => this.syncProduct(line));
      }
    });
  }

  syncProduct(line: any) {
    const product = this.products.find((item) => item.sku_code === line.sku);
    if (product) line.product_name = product.product_name;
  }

  downloadTemplate() {
    const rows = [{
      customer_po_number: this.customerPoNumber || 'PO-KH-001',
      delivery_date: this.deliveryDate,
      shipping_address: this.shippingAddress,
      note: 'Ghi chú giao hàng (không bắt buộc)',
      sku: 'SKU-10007',
      product_name: this.products.find((product) => product.sku_code === 'SKU-10007')?.product_name || '',
      quantity: 50,
      uom_code: 'EA',
      unit_price: ''
    }];
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'PO_Template');
    XLSX.writeFile(workbook, 'SOH_PO_Template.xlsx');
    this.importMessage = 'Đã tải mẫu PO. Mỗi dòng là một sản phẩm; các thông tin PO có thể lặp lại trên các dòng.';
  }

  importFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const workbook = XLSX.read(reader.result, { type: 'array', cellDates: false });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });
        if (!rows.length) throw new Error('File không có dòng dữ liệu.');
        const normalized = rows.map((row) => {
          const get = (...keys: string[]) => {
            const key = Object.keys(row).find((name) => keys.includes(name.trim().toLowerCase()));
            return key ? row[key] : '';
          };
          const price = String(get('unit_price', 'price', 'don_gia', 'đơn giá')).trim();
          return {
            sku: String(get('sku', 'sku_code', 'customer_sku')).trim(),
            product_name: String(get('product_name', 'product', 'ten_san_pham')).trim(),
            quantity: Number(get('quantity', 'qty', 'so_luong') || 0),
            uom_code: String(get('uom_code', 'uom', 'don_vi_tinh') || 'EA').trim().toUpperCase(),
            unit_price: price === '' ? null : Number(price)
          };
        }).filter((line) => line.sku || line.product_name);
        if (normalized.some(({ unit_price }) => unit_price !== null && (!Number.isFinite(unit_price) || unit_price < 0))) {
          throw new Error('Đơn giá phải là số lớn hơn hoặc bằng 0.');
        }
        if (!normalized.length) throw new Error('Không tìm thấy dòng sản phẩm hợp lệ.');
        const first = rows[0];
        const value = (keys: string[]) => {
          const key = Object.keys(first).find((name) => keys.includes(name.trim().toLowerCase()));
          return key ? String(first[key] || '') : '';
        };
        this.customerPoNumber = value(['customer_po_number', 'customer_reference_po', 'po_number', 'ma_po']) || this.customerPoNumber;
        this.deliveryDate = value(['delivery_date', 'requested_delivery_date', 'ngay_giao']) || this.deliveryDate;
        this.shippingAddress = value(['shipping_address', 'ship_to', 'dia_chi_nhan']) || this.shippingAddress;
        this.lines = normalized;
        this.lines.forEach((line) => this.syncProduct(line));
        this.importMessage = `Đã đọc ${this.lines.length} dòng từ ${file.name}. Hệ thống đã tự điền thông tin, bạn kiểm tra rồi bấm gửi PO.`;
      } catch (error: any) {
        this.importMessage = `Không thể đọc file: ${error.message || 'định dạng không hợp lệ'}`;
      }
    };
    reader.readAsArrayBuffer(file);
    input.value = '';
  }

  addLine() {
    this.lines.push({ sku: '', product_name: '', quantity: 10, uom_code: 'BOX', unit_price: null });
  }
  removeLine(idx: number) {
    if (this.lines.length > 1) this.lines.splice(idx, 1);
  }
  submitPo() {
    if (!this.canSubmit) {
      alert('Tài khoản chưa được liên kết SAP Customer ID hoặc chưa được cấp quyền đặt hàng.');
      return;
    }
    const invalidPriceIndex = this.lines.findIndex(({ unit_price }) =>
      unit_price !== null && (!Number.isFinite(unit_price) || unit_price < 0)
    );
    if (invalidPriceIndex !== -1) {
      alert('Đơn giá tại dòng ' + (invalidPriceIndex + 1) + ' phải là số lớn hơn hoặc bằng 0.');
      return;
    }
    this.api.createOrder({
      customer_id: this.auth.currentUser()?.customer_id || 'CUS001',
      customer_po_number: this.customerPoNumber,
      delivery_date: this.deliveryDate,
      shipping_address: this.shippingAddress,
      items: this.lines,
      created_by: this.auth.currentUser()?.username
    }).subscribe({
      next: (res: any) => {
        alert(res.message || 'PO đã được tiếp nhận.');
        this.router.navigate(['/app/orders']);
      },
      error: (err) => alert(err.error?.message || 'PO chưa được tiếp nhận. Vui lòng kiểm tra lại dữ liệu.')
    });
  }
}
