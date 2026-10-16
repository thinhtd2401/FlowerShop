# 🌸 Floral Studio - Quản Lý Đơn Hoa & Chi Phí Vốn

Phần mềm quản lý tiệm hoa tối ưu cho dịp cao điểm lễ (đặc biệt ngày Phụ nữ Việt Nam 20/10), hỗ trợ thợ hoa kiểm soát đơn đặt trước, tiến độ cắm hoa theo khung giờ hẹn lấy, công nợ tiền cọc và báo cáo doanh thu - lợi nhuận tự động.

---

## ✨ Tính Năng Nổi Bật

1. **Tổng Quan Kinh Doanh (Dashboard)**:
   - 4 Thẻ KPI: Doanh thu, Tổng vốn bỏ ra, Lợi nhuận ước tính, Tiền chờ thu (công nợ).
   - Banner cảnh báo chiến dịch cao điểm 20/10.
   - Thống kê tỷ lệ hoàn thành đơn, Top 5 mẫu hoa bán chạy nhất và kênh tiếp nhận (Instagram, Zalo, Điện thoại, Trực tiếp).
2. **Quản Lý Đơn Hàng (Orders)**:
   - Lọc đơn đa chiều: Trạng thái (Chờ cắm, Đã bó xong, Đã giao, Đã hủy) & Lọc nhanh (Hôm nay 16/10, Cao điểm 20/10, Đơn chưa trả hết cọc).
   - Thao tác nhanh: In hóa đơn/bill VietQR tự động, chỉnh sửa đơn, xóa đơn.
   - Thẻ hiển thị chuyên biệt trên Mobile và bảng dữ liệu rộng trên Desktop.
3. **Tiến Độ Cắm Hoa Theo Giờ (Timeline)**:
   - Sắp xếp đơn theo nhóm ngày và khung giờ hẹn lấy để hoa luôn tươi mới nhất khi khách nhận.
   - Thẻ giao hàng (`Ship` tận nơi vs `Khách tự qua lấy`).
4. **Quản Lý Vốn & Chi Phí (Expenses)**:
   - Theo dõi chi phí nhập hoa tươi từ chợ đầu mối/nhà vườn, phụ liệu (giấy gói, xốp, nơ) và chi phí vận hành dịp lễ.
5. **In Phiếu Giao Hoa & VietQR**:
   - Tự động sinh mã VietQR theo chuẩn Napas với đúng số tiền công nợ còn lại và nội dung chuyển khoản là mã đơn hàng.
   - Hỗ trợ in trực tiếp hoặc lưu file PDF.
6. **Hệ Thống Vector Icon Lucide (100% Offline)**:
   - Thay thế toàn bộ emoji sang các vector SVG sắc nét từ thư viện [Lucide Icons](https://lucide.dev/icons/).
   - Thư viện tích hợp nội bộ, hoạt động ngoại tuyến không cần internet.

---

## 🛠️ Công Nghệ Sử Dụng

- **HTML5 & CSS3**: Vanilla CSS linh hoạt, kiến trúc biến CSS tokens (`variables.css`), responsive hoàn hảo trên Mobile, Tablet và Desktop.
- **JavaScript (ES6+)**: Quản lý trạng thái State/Store theo mô hình Publish-Subscribe, lưu trữ `localStorage` bền vững.
- **SheetJS (xlsx)**: Xuất toàn bộ dữ liệu đơn hàng và chi phí ra file Excel (.xlsx).
- **Lucide Icons**: Bộ vector SVG icon đồng nhất, hiện đại.

---

## 🚀 Hướng Dẫn Chạy Cục Bộ

1. Mở thư mục dự án trong trình duyệt hoặc chạy một web server tĩnh bất kỳ:
   ```bash
   # Sử dụng Python
   python -m http.server 4500

   # Hoặc sử dụng Node.js npx serve
   npx serve .
   ```
2. Truy cập địa chỉ `http://localhost:4500` trên trình duyệt máy tính hoặc điện thoại.
