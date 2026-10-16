# Quy Tắc Dự Án FlowerShop (Workspace Instructions)

Tất cả các tính năng hiện tại và phát triển về sau phải tuân thủ nghiêm ngặt các quy tắc sau:

## 1. Biểu Tượng Giao Diện (Lucide Icons Only)
- Client **bắt buộc dùng `lucide-react`** cho tất cả các icon.
- **Tuyệt đối không dùng emoji** cho: các nút bấm, icon menu điều hướng, thanh tìm kiếm, nhãn trạng thái đơn hàng, thẻ KPI, icon thao tác (sửa, xóa, xem...), modal và toast notifications.
- Dùng các icon thích hợp như: `Plus`, `Search`, `FileSpreadsheet`, `LayoutDashboard`, `ShoppingBag`, `Calendar`, `DollarSign`, `TrendingUp`, `Clock`, `Edit3`, `Trash2`, `CheckCircle2`, `AlertCircle`, `X`, `Sparkles`, `Package`, `Store`, `Truck`, `Phone`, `User`, `Tag`, `ChevronRight`.

## 2. Thiết Kế Responsive Cho Tất Cả Các Màn Hình
- Giao diện phải tương thích mượt mà trên Mobile (< 768px), Tablet (768px - 1024px) và Desktop (> 1024px).
- **Trên thiết bị di động**:
  - Giao diện phải cực kỳ tinh gọn, trực quan, dễ thao tác với một tay.
  - Sử dụng Mobile Navigation Bar ở chân trang cho các tab chính.
  - Sử dụng Floating Action Button (FAB) cho tác vụ nhanh (Tạo đơn mới).
  - Tự động chuyển đổi bảng dữ liệu lớn (`table`) thành các thẻ danh thiếp gọn đẹp (`mobile cards`).
  - Các thanh lọc (filter tabs, date pills) cuộn ngang mượt mà với `overflow-x: auto` và ẩn thanh cuộn thô.
  - Kích thước các nút bấm đạt tiêu chuẩn cảm ứng dễ bấm (touch target).

## 3. Chống Phóng To (No Zoom) Khi Nhập Dữ Liệu Trên Mobile
- Mobile browsers (Safari/Chrome) tự động zoom khi focus vào input có font-size < 16px.
- **Quy định**:
  - Thẻ viewport trong `index.html` cấu hình `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover`.
  - Mọi `input`, `select`, `textarea` trên mobile (< 768px) phải có cỡ chữ tối thiểu `16px` (`font-size: 16px !important`).
  - Thiết lập `touch-action: manipulation;` để thao tác chạm mượt mà, không giật phóng to.
