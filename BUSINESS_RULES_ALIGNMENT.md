# Đối chiếu quy tắc nghiệp vụ Smart Order Hub

Tài liệu này đối chiếu Chương 3 (TO-BE, Business Rules, Order Lifecycle) và Chương 4 (Use Case/điều hướng chức năng) với prototype hiện tại.

## Luồng TO-BE chính

1. B2B đăng nhập bằng tài khoản đã `ACTIVE` và có liên kết SAP Customer ID.
2. Khách hàng tạo PO bằng Form hoặc File Upload; Phase 1 chỉ công nhận B2B Portal.
3. SOH tiếp nhận, cấp Hub Order ID, lưu PO version và chạy Validation/Mapping.
4. PO có lỗi chặn chuyển sang `PENDING_CORRECTION`; lỗi tham chiếu chuyển sang ngoại lệ/HITL.
5. Chỉ PO không còn Blocking Error/Pending Verification bắt buộc mới được `READY_FOR_SAP`.
6. SOH kiểm tra Pre-flight, chống gửi trùng, gửi SAP và chỉ ghi nhận Sales Order khi có Business Result.
7. Sau SAP tiếp tục các bước kho, giao hàng, khiếu nại và hoàn tất; đây là các luồng mở rộng tiếp theo.

## Quy tắc đã đưa vào prototype

| Nguồn | Quy tắc | Hiện thực |
| --- | --- | --- |
| QTKD-01/02/03 | Đăng ký phải hợp lệ; tài khoản chờ xác minh; chỉ tài khoản ACTIVE có liên kết SAP mới đặt PO | `business-rules.js`, `auth.routes.js` |
| QTKD-04 | RBAC theo vai trò và phạm vi đối tác | `role.guard.ts`, `shell.component.ts`, API scope theo `customerId` |
| QTKD-07/14/17/18/20 | PO có dòng sản phẩm; SKU, số lượng nguyên dương, UOM, ngày giao hợp lệ | `validateOrderInput()` và kiểm tra Master Data trong `orders.routes.js` |
| QTKD-10/11 | Cấp Hub Order ID; cảnh báo/kiểm soát gửi trùng | PO lưu `hub_order_id`, `customer_reference_po`; SAP chặn giao dịch đang chờ kết quả |
| QTKD-22/26/28 | Không chuyển SAP khi Validation chưa đạt; sửa xong phải kiểm tra lại | Trạng thái `READY_FOR_SAP`, `PENDING_CORRECTION`, kiểm tra trước SAP |
| QTKD-23 | Không đồng nhất gửi thành công với SAP đã tạo Sales Order | SAP chỉ cập nhật `SAP_ACCEPTED` sau Business Result mô phỏng |
| QTKD-29/30 | Ghi lịch sử chuyển trạng thái và phân biệt chờ khách hàng/nội bộ | `po_status_history`, thông báo lỗi Validation |

## Phạm vi còn mở theo tài liệu

- Bulk `.xlsx/.csv`, chứng từ đính kèm và lưu file gốc.
- Validation chi tiết theo Sold-to/Ship-to, Mapping SAP và quy đổi UOM theo từng SKU.
- Đối soát timeout/Technical ACK và cơ chế retry an toàn với SAP thật.
- Ticket tồn kho, thiếu hàng, giao hàng, khiếu nại và hậu mãi.

Các phần này không bị giả lập là đã hoàn tất; menu hiện tại chỉ mở các chức năng đã có API hoặc hiển thị rõ phạm vi prototype/Phase 2.
