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

### 3. Chạy toàn bộ hệ thống + Mở đường hầm Cloudflare Tunnel ra Internet
```bash
npm run dev:all
```
> Hoặc trên Windows: **Click đúp vào file `start-all.bat`**
- Chạy đồng thời: Backend (3001) + Frontend (5173) + Cloudflare Quick Tunnel kết nối toàn cầu.
- Đường dẫn công khai tự động hiển thị trong terminal (dạng `https://*.trycloudflare.com`) và được lưu vào file `public-url.txt`.
- **Ưu điểm vượt trội so với Ngrok**: **Hoàn toàn miễn phí, không giới hạn băng thông (1GB limit của Ngrok), không có màn hình cảnh báo trung gian**.

---

## 🌐 Hướng Dẫn Chi Tiết Cấu Hình & Chạy Đường Hầm Cloudflare Tunnel

Dự án sử dụng giải pháp **Cloudflare Quick Tunnel (TryCloudflare)** để đưa toàn bộ hệ thống ra ngoài Internet:

### 1. Khởi chạy đường hầm riêng lẻ
Nếu bạn đã khởi chạy `npm run dev` ở một terminal khác và chỉ muốn mở đường hầm trực tuyến:
```bash
npm run tunnel
```
Hoặc chạy trực tiếp file thực thi có sẵn trong dự án:
```powershell
.\cloudflared.exe tunnel --url http://localhost:5173
```
Terminal sẽ tự động in ra URL trực tuyến dạng:
👉 **`https://[subdomain].trycloudflare.com`** đồng thời lưu tự động vào file `public-url.txt`.

### 2. Cơ chế hoạt động của Reverse Proxy (Tại sao map vào cổng 5173?)
Trong kiến trúc của Floral Studio:
```
[ Khách hàng / Điện thoại ngoài Internet ]
                 │
                 ▼ (HTTPS qua Cloudflare CDN)
    https://*.trycloudflare.com
                 │
                 ▼ (Cloudflare Tunnel)
    Vite Dev Server (Port 5173) ──► Phục vụ giao diện React SPA
                 │
                 ├──► /api/*       ──(Proxy nội bộ)──► Express Backend (Port 3001)
                 └──► /uploads/*   ──(Proxy nội bộ)──► Static Flower Images (Port 3001)
```

- **Cloudflare trỏ thẳng vào cổng 5173 (Frontend)**: Khi người dùng truy cập từ xa, họ sẽ tải mã nguồn giao diện React, icon SVG Lucide, font chữ và CSS từ Vite.
- **Vite Proxy tự động chuyển tiếp API & Ảnh**: Trong file `client/vite.config.js`:
  ```javascript
  server: {
    host: true,
    port: 5173,
    allowedHosts: true, // Cho phép tên miền bên ngoài truy cập không bị lỗi Invalid Host
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
- **Lợi ích**: Không gặp vấn đề CORS, không cần mở nhiều cổng cùng lúc, chỉ cần 1 URL duy nhất là sử dụng được toàn bộ tính năng.

### 3. Ưu Điểm Tuyệt Đối Của Cloudflare So Với Ngrok
- **Không giới hạn băng thông**: Không bao giờ lo bị cắt mạng vì vượt quá quota 1GB/tháng.
- **Không có màn hình cảnh báo**: Khách hàng bấm link là vào thẳng giao diện đặt hàng/xem tiến độ mượt mà.
- **Không cần tài khoản hay cấu hình token phức tạp**.

---

## 📋 Bảng Tổng Hợp Lệnh npm scripts

| Lệnh | Mô tả |
| :--- | :--- |
| `npm run dev` | **Chạy cả Backend (3001) và Frontend (5173)** bằng 1 lệnh qua `concurrently` |
| `npm run dev:all` | **Chạy cả 3 dịch vụ**: Backend + Frontend + Cloudflare Tunnel |
| `npm run tunnel` | Khởi chạy Cloudflare Quick Tunnel (Mặc định) |
| `npm run tunnel:cf` | Khởi chạy Cloudflare Quick Tunnel |
| `npm run tunnel:ngrok` | Khởi chạy Ngrok Tunnel (Dự phòng) |
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
- **Cloudflare Tunnel (cloudflared)**: Đường hầm bảo mật HTTPS đưa localhost ra toàn cầu không giới hạn băng thông.
