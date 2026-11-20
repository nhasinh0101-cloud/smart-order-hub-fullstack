# Smart Order Hub - Fullstack (Angular + Node.js/Express + MongoDB)

## 0. Chuẩn bị MongoDB và import bộ dữ liệu mẫu

Khởi động MongoDB local tại `mongodb://127.0.0.1:27017`, sau đó chạy PowerShell từ thư mục gốc project:

```powershell
cd mongodb
.\import_all.ps1
```

Script sẽ import toàn bộ file JSON vào database `smart_order_hub` và tạo các index trong [create_indexes.js](./mongodb/create_indexes.js).

Nếu MongoDB chạy ở URI khác:

```powershell
.\import_all.ps1 -MongoUri 'mongodb://localhost:27017' -Database 'smart_order_hub'
```

Thư mục [mongodb/](./mongodb/) chứa dataset đã được đóng gói cùng project, nên không cần tham chiếu tới thư mục dữ liệu bên ngoài.

## 1. Khởi chạy Backend (`smart-order-hub-server`)
```bash
cd smart-order-hub-server
npm install
node index.js
```
Server chạy tại `http://localhost:3000` và kết nối MongoDB `mongodb://127.0.0.1:27017/smart_order_hub`.

## 2. Khởi chạy Frontend (`smart-order-hub-client`)
```bash
cd smart-order-hub-client
npm install
npm start
```
Truy cập `http://localhost:4200` và chọn 1 trong 4 vai trò mẫu (Admin, Chăm sóc khách hàng, Khách hàng B2B, Giám sát kinh doanh) để trải nghiệm đầy đủ phân quyền.

## 3. Chạy thành một app duy nhất

Sau khi đã cài dependency cho cả hai thư mục, chạy:

```bash
cd smart-order-hub-server
npm run start:fullstack
```

Mở `http://localhost:3000`. Backend sẽ phục vụ Angular build và API cùng một origin; không cần chạy riêng cổng `4200`.
