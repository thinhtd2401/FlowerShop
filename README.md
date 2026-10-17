# 🌸 Floral Studio - Quản Lý Đơn Hoa & Chi Phí Vốn

Phần mềm quản lý tiệm hoa tối ưu cho dịp cao điểm lễ (đặc biệt ngày Phụ nữ Việt Nam 20/10), hỗ trợ thợ hoa kiểm soát đơn đặt trước, tiến độ cắm hoa theo khung giờ hẹn lấy, công nợ tiền cọc, tải ảnh mẫu hoa tham khảo và báo cáo doanh thu - lợi nhuận tự động.

---

## ⚡ Khởi Chạy Nhanh (Quick Start)

Dự án đã được cấu hình lệnh đồng thời để bạn không cần phải mở nhiều cửa sổ terminal riêng lẻ:

### 1. Cài đặt toàn bộ dependencies (lần đầu tiên)
```bash
npm run install:all
```
*(Lệnh này tự động cài đặt thư viện ở cả thư mục gốc, `server/` và `client/`)*

### 2. Chạy cả Frontend và Backend bằng 1 lệnh duy nhất
```bash
npm run dev
```
> Hoặc trên Windows: **Click đúp vào file `start-dev.bat`**
- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **Frontend Web (Vite)**: [http://localhost:5173](http://localhost:5173)
- Giao diện console hiển thị song song log của Backend (màu xanh lá) và Frontend (màu xanh dương).

### 3. Chạy toàn bộ hệ thống + Mở đường hầm Ngrok ra Internet
```bash
npm run dev:all
```
> Hoặc trên Windows: **Click đúp vào file `start-all.bat`**
- Chạy đồng thời: Backend (3001) + Frontend (5173) + Ngrok Tunnel kết nối tên miền công khai.
- Truy cập trực tiếp từ điện thoại hoặc mạng ngoài: **https://wimp-crumb-language.ngrok-free.dev**

---

## 🌐 Hướng Dẫn Chi Tiết Cấu Hình & Chạy Proxy Qua Ngrok

Dự án sử dụng tên miền cố định miễn phí của Ngrok:
👉 **`https://wimp-crumb-language.ngrok-free.dev`**

### 1. Lệnh chạy đường hầm Ngrok riêng lẻ
Nếu bạn đã khởi chạy `npm run dev` ở một terminal khác và chỉ muốn mở thêm ngrok tunnel:
```bash
npm run tunnel
```
Hoặc chạy trực tiếp file thực thi có sẵn trong dự án:
```powershell
.\ngrok.exe http --domain=wimp-crumb-language.ngrok-free.dev 5173
```

### 2. Cơ chế hoạt động của Reverse Proxy (Tại sao map vào cổng 5173?)
Trong kiến trúc của Floral Studio:
```
[ Khách hàng / Điện thoại ngoài Internet ]
                 │
                 ▼ (HTTPS)
   https://wimp-crumb-language.ngrok-free.dev
                 │
                 ▼ (Ngrok Tunnel)
    Vite Dev Server (Port 5173) ──► Phục vụ giao diện React SPA
                 │
                 ├──► /api/*       ──(Proxy nội bộ)──► Express Backend (Port 3001)
                 └──► /uploads/*   ──(Proxy nội bộ)──► Static Flower Images (Port 3001)
```

- **Ngrok trỏ thẳng vào cổng 5173 (Frontend)**: Khi người dùng truy cập từ xa, họ sẽ tải mã nguồn giao diện React, icon SVG Lucide, font chữ và CSS từ Vite.
- **Vite Proxy tự động chuyển tiếp API & Ảnh**: Trong file `client/vite.config.js`:
  ```javascript
  server: {
    host: true,
    port: 5173,
    allowedHosts: true, // Cho phép tên miền ngrok truy cập không bị lỗi Invalid Host
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  }
  ```
  Nhờ cấu hình này, mọi request API (`/api/orders`, `/api/metrics`, `/api/expenses`) và hình ảnh upload (`/uploads/...`) đều được Vite âm thầm chuyển tiếp sang Express API (cổng 3001).
- **Lợi ích**: Không gặp vấn đề CORS, không cần mở nhiều cổng ngrok cùng lúc, chỉ cần 1 URL duy nhất là sử dụng được toàn bộ tính năng.

### 3. Lưu ý quan trọng khi dùng Ngrok
- **Lỗi trùng phiên (ERR_NGROK_324)**: Gói Free của Ngrok chỉ cho phép 1 session kết nối tới 1 static domain tại một thời điểm. Nếu báo lỗi domain đang bị chiếm giữ, bạn chỉ cần kiểm tra và tắt (Ctrl + C) terminal ngrok cũ đang chạy ngầm.
- **Thiết lập Token (nếu chạy trên máy tính mới)**:
  ```bash
  .\ngrok.exe config add-authtoken <YOUR_AUTHTOKEN>
  ```

---

## 📋 Bảng Tổng Hợp Lệnh npm scripts

| Lệnh | Mô tả |
| :--- | :--- |
| `npm run dev` | **Chạy cả Backend (3001) và Frontend (5173)** bằng 1 lệnh qua `concurrently` |
| `npm run dev:all` | **Chạy cả 3 dịch vụ**: Backend + Frontend + Ngrok Tunnel |
| `npm run tunnel` | Khởi chạy đường hầm Ngrok tới domain `wimp-crumb-language.ngrok-free.dev` |
| `npm run server` | Chạy riêng Backend Express API (chế độ `--watch` tự reload khi sửa code) |
| `npm run client` | Chạy riêng Frontend Vite React Dev Server |
| `npm run install:all` | Tự động `npm install` cho thư mục gốc, thư mục `server/` và `client/` |

---

## ✨ Tính Năng Nổi Bật Của Hệ Thống

1. **Tổng Quan Kinh Doanh (Dashboard)**:
   - 4 Thẻ KPI: Doanh thu, Tổng vốn bỏ ra, Lợi nhuận ước tính, Tiền chờ thu (công nợ).
   - Banner cảnh báo chiến dịch cao điểm 20/10 đếm ngược tiến độ.
   - Thống kê tỷ lệ hoàn thành đơn, Top 5 mẫu hoa bán chạy nhất và kênh tiếp nhận (Instagram, Zalo, Điện thoại, Trực tiếp).
2. **Quản Lý Đơn Hàng (Orders)**:
   - Quản lý danh sách đơn đa trạng thái: `Chờ cắm`, `Đã bó xong`, `Đã giao`, `Đã hủy`.
   - Bộ lọc tiện lợi: Hôm nay, Cao điểm 20/10, Đơn chưa thanh toán đủ cọc.
   - **Tải & Xem ảnh mẫu hoa tham khảo**: Hỗ trợ đính kèm tối đa 10 ảnh mẫu cho mỗi đơn hàng (chụp trực tiếp từ camera điện thoại hoặc tải ảnh từ thư viện), xem phóng to dạng lightbox preview.
   - Thao tác nhanh: In hóa đơn/bill VietQR tự động, chỉnh sửa đơn, xóa đơn.
   - Giao diện thích ứng: Tự động biến đổi thành thẻ danh thiếp gọn đẹp trên Mobile và bảng dữ liệu rộng trên Desktop.
3. **Tiến Độ Cắm Hoa Theo Giờ (Timeline)**:
   - Sắp xếp đơn theo nhóm ngày và khung giờ hẹn lấy để hoa luôn tươi mới nhất khi khách nhận.
   - Phân biệt hình thức nhận hoa: `Giao tận nơi (Ship)` vs `Khách tự ghé lấy`.
4. **Quản Lý Vốn & Chi Phí (Expenses)**:
   - Theo dõi chi phí nhập hoa tươi từ chợ đầu mối/nhà vườn, phụ liệu (giấy gói, xốp, nơ) và chi phí vận hành dịp lễ.
5. **In Phiếu Giao Hoa & VietQR Tự Động**:
   - Tự động sinh mã VietQR theo chuẩn Napas với đúng số tiền công nợ còn lại và nội dung chuyển khoản là mã đơn hàng.
   - Hỗ trợ in trực tiếp hoặc lưu file PDF.
6. **Chuẩn Trải Nghiệm Mobile & Offline**:
   - **Chống giật phóng to (No-Zoom)**: Cấu hình `font-size: 16px` cho toàn bộ input trên mobile, `touch-action: manipulation` giúp trải nghiệm chạm mượt mà như app native.
   - **100% Lucide Icons**: Toàn bộ icon trong hệ thống sử dụng `lucide-react`, không dùng emoji thô, đảm bảo tính thẩm mỹ cao cấp đồng nhất.

---

## 🛠️ Công Nghệ Sử Dụng

### Frontend
- **React 19** & **Vite 8**: Khởi động siêu tốc, HMR tức thì.
- **Lucide React**: Bộ icon vector chuẩn hóa, sắc nét.
- **Axios**: Quản lý API client kết nối tập trung.
- **SheetJS (xlsx)**: Xuất báo cáo dữ liệu đơn hàng ra file Excel.
- **Vanilla CSS & Design Tokens**: Tối ưu hiệu năng, phong cách Glassmorphism hiện đại, responsive từ mobile đến desktop.

### Backend
- **Node.js** & **Express 5**: RESTful API xử lý dữ liệu đơn hàng, chi phí và chỉ số kinh doanh.
- **Better-SQLite3**: Cơ sở dữ liệu SQLite siêu nhẹ, tốc độ cao, lưu trữ bền vững tại `server/data/flowershop.db`.
- **Multer**: Tiếp nhận và lưu trữ file ảnh tham khảo mẫu hoa (giới hạn an toàn lên tới 25MB mỗi ảnh, hỗ trợ ảnh chụp từ điện thoại Samsung/iPhone).
- **Auto Seeding**: Tự động tạo dữ liệu mẫu khi khởi động lần đầu nếu cơ sở dữ liệu còn trống.

### Mạng & Triển Khai
- **Concurrently**: Quản lý chạy song song nhiều tiến trình trong 1 terminal duy nhất.
- **Ngrok**: Đặt đường hầm an toàn đưa localhost ra Internet với tên miền cố định.
