# ĐỒ ÁN KIẾN TẬP – SMART ORDER HUB

Smart Order Hub (SOH) là website quản lý đơn đặt hàng B2B. Khách hàng gửi đơn đặt hàng (PO) qua cổng web. Nhân viên theo dõi quá trình tiếp nhận, kiểm tra dữ liệu, xử lý ngoại lệ và mô phỏng chuyển đơn sang SAP để tạo Sales Order.

## 🏛️ 1. Cấu trúc dự án

```text
├── smart-order-hub-client/   # Giao diện Angular 19
├── smart-order-hub-server/   # REST API và quy tắc nghiệp vụ
├── mongodb/                 # Dữ liệu mẫu cho 20 collection và script import
├── BUSINESS_RULES_ALIGNMENT.md
├── README_RUN.md
├── .gitignore
└── README.md
```

## ⚙️ 2. Công nghệ và tính năng

- **Frontend:** Angular 19, TypeScript, RxJS, Angular Router và thư viện XLSX.
- **Backend:** Node.js, Express, Mongoose và bcryptjs.
- **Cơ sở dữ liệu:** MongoDB, database mặc định `smart_order_hub` với dữ liệu mẫu cho 20 collection.

### Tính năng chính

- **Cổng B2B:** Đăng nhập theo vai trò, tạo PO bằng biểu mẫu hoặc đọc dữ liệu từ tệp Excel/CSV để điền dòng hàng.
- **Quản lý PO:** Tìm kiếm và lọc đơn theo trạng thái, kênh tiếp nhận và ngày. Xem dòng hàng, phiên bản và lịch sử trạng thái.
- **Kiểm tra dữ liệu và xử lý ngoại lệ:** Kiểm tra SKU, đơn vị tính, số lượng và ngày giao yêu cầu. Theo dõi các trường hợp cần bổ sung thông tin.
- **Mô phỏng SAP:** Kiểm tra trạng thái PO trước khi chuyển, theo dõi giao dịch và ghi nhận mã Sales Order từ kết quả nghiệp vụ mô phỏng.
- **Vận hành:** Xem chỉ số tổng quan, xác minh tài khoản, tra cứu tồn kho, tạo yêu cầu hỗ trợ và xem lịch sử xuất báo cáo.

Xem thêm [quy tắc nghiệp vụ và phạm vi prototype](./BUSINESS_RULES_ALIGNMENT.md).

## 🚀 3. Cài đặt và chạy dự án

**Yêu cầu:** Node.js 22, npm và MongoDB Community Server đang chạy tại `mongodb://127.0.0.1:27017`.

### Bước 1. Cài thư viện và nạp dữ liệu mẫu

Chạy từ thư mục gốc của repository.

```sh
npm --prefix smart-order-hub-server ci
npm --prefix smart-order-hub-client ci
node mongodb/import_from_node.js
```

Script nạp 20 collection mẫu và tạo chỉ mục trong database `smart_order_hub`. Mỗi lần import sẽ thay thế dữ liệu của các collection cùng tên trong database đích.

### Bước 2. Khởi động backend

Chạy từ thư mục gốc.

```sh
npm --prefix smart-order-hub-server start
```

API chạy tại [http://localhost:3000](http://localhost:3000). Kiểm tra máy chủ tại [`/api/health`](http://localhost:3000/api/health).

### Bước 3. Khởi động frontend

Mở terminal thứ hai tại thư mục gốc.

```sh
npm --prefix smart-order-hub-client start
```

Mở [http://localhost:4200](http://localhost:4200) để đăng nhập.

### Chạy frontend và backend trên cùng cổng

Sau khi cài thư viện và nạp dữ liệu, dùng lệnh sau thay cho bước 2 và 3. Lệnh sẽ build Angular và phục vụ cả giao diện lẫn API tại [http://localhost:3000](http://localhost:3000).

```sh
npm --prefix smart-order-hub-server run start:fullstack
```

## 👥 4. Tài khoản thử nghiệm

Chọn vai trò trên màn hình đăng nhập hoặc nhập tên đăng nhập dưới đây. Cả bốn tài khoản demo dùng mật khẩu `Demo@12345`.

| Vai trò | Tên đăng nhập |
| --- | --- |
| Quản trị viên | `alex.le` |
| Chăm sóc khách hàng | `linh.nguyen` |
| Khách hàng B2B | `minh.tran` |
| Giám sát kinh doanh | `anh.pham` |
