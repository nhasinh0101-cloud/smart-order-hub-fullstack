import { Component, OnInit, signal } from '@angular/core';
import { SohApiService } from '../../services/soh-api.service';

@Component({
  selector: 'app-assistant',
  standalone: false,
  template: `
    <div style="max-width:900px;">
      <p style="font-size:11px; font-weight:600; color:#71717a;">SMART ORDER HUB AI</p>
      <h1 style="font-size:26px; margin-bottom:6px;">Trợ lý AI nghiệp vụ B2B</h1>
      <p style="color:#71717a; margin-bottom:18px;">Tra cứu PO, SKU, tồn kho và hướng dẫn xử lý ngay trong không gian SOH.</p>
      <div class="card" style="min-height:420px; display:flex; flex-direction:column;">
        <div style="flex:1;">
          @for (item of messages(); track $index) {
            <div style="margin-bottom:14px; text-align:left;">
              <span class="badge" [class.badge-gray]="item.sender === 'user'" [class.badge-blue]="item.sender === 'assistant'">{{ item.sender === 'user' ? 'Bạn' : 'SOH AI' }}</span>
              <div style="margin-top:5px; padding:10px 12px; background:#fafafa; border-radius:8px;">{{ item.text }}</div>
            </div>
          }
        </div>
        <div style="display:flex; gap:8px; border-top:1px solid #eee; padding-top:14px;">
          <input class="input-control" [(ngModel)]="question" (keyup.enter)="ask()" placeholder="Ví dụ: PO gần nhất của tôi đang ở trạng thái nào?">
          <button class="btn btn-primary" (click)="ask()" [disabled]="loading()">{{ loading() ? 'Đang tra cứu...' : 'Hỏi trợ lý' }}</button>
        </div>
        <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn" (click)="quickAsk('Tình hình tồn kho hiện tại thế nào?')">Tình hình tồn kho</button>
          <button class="btn" (click)="quickAsk('PO gần nhất của tôi đang ở trạng thái nào?')">Trạng thái PO</button>
          <button class="btn" (click)="quickAsk('Danh mục sản phẩm hiện có bao nhiêu SKU?')">Tra cứu sản phẩm</button>
        </div>
      </div>
    </div>
  `
})
export class AssistantComponent implements OnInit {
  question = '';
  loading = signal(false);
  messages = signal<any[]>([{ sender: 'assistant', text: 'Xin chào! Tôi có thể hỗ trợ bạn tra cứu PO, sản phẩm và tồn kho.' }]);
  constructor(private api: SohApiService) {}
  ngOnInit(): void {}
  quickAsk(value: string) { this.question = value; this.ask(); }
  ask() {
    const question = this.question.trim();
    if (!question || this.loading()) return;
    this.messages.update((items) => [...items, { sender: 'user', text: question }]);
    this.question = '';
    this.loading.set(true);
    this.api.askAssistant(question).subscribe({
      next: (res) => { this.messages.update((items) => [...items, { sender: 'assistant', text: res.answer }]); this.loading.set(false); },
      error: () => { this.messages.update((items) => [...items, { sender: 'assistant', text: 'Tôi chưa kết nối được dữ liệu SOH. Vui lòng thử lại.' }]); this.loading.set(false); }
    });
  }
}
