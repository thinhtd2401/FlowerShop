# Quy Tắc Phát Triển UI & Trải Nghiệm Người Dùng (Frontend UI Guidelines)

Quy tắc này bắt buộc áp dụng cho toàn bộ các tính năng, trang và thành phần mới hoặc chỉnh sửa trong thư mục `client/`.

---

## 1. Bắt Buộc Sử Dụng Lucide Icons (`lucide-react`)

- **Không sử dụng emoji** làm biểu tượng cho: nút bấm (buttons), menu điều hướng, thanh tìm kiếm, tiêu đề card, nhãn trạng thái (status badges), tab chuyển đổi, thao tác (sửa/xóa/lưu), thông báo toast.
- **Thư viện icon**: Duy nhất sử dụng `lucide-react`.
- **Quy chuẩn kích thước và phong cách**:
  - Icon trong button / action nhỏ: `size={15}` hoặc `size={16}`
  - Icon trong thanh menu / bottom bar / search: `size={18}` hoặc `size={20}`
  - Icon trong thẻ KPI / header lớn: `size={22}` hoặc `size={24}`
  - Stroke width mặc định: `strokeWidth={2}`
  - Luôn căn giữa icon với text bằng `display: inline-flex; align-items: center; gap: ...`
  - Đặt tên icon trực quan, mang tính ngữ nghĩa (VD: `Plus`, `Search`, `FileSpreadsheet`, `TrendingUp`, `Wallet`, `Calendar`, `Clock`, `Edit3`, `Trash2`, `CheckCircle2`, `AlertCircle`, `X`, `ChevronRight`).

---

## 2. Thiết Kế Responsive Đa Thiết Bị - Tối Ưu Mobile Thân Thiện & Đơn Giản

- **Hỗ trợ mọi kích cỡ màn hình**:
  - Desktop (> 1024px): Bố cục Sidebar + Main Content đầy đủ, bảng dữ liệu chi tiết (`data-table`).
  - Tablet (768px - 1024px): Grid co giãn tự động, bố cục thu gọn hợp lý.
  - Mobile (< 768px): Giao diện đơn giản, thao tác bằng 1 ngón tay cái dễ dàng.
- **Tiêu chuẩn Mobile UX**:
  - **Ẩn bảng phức tạp trên mobile**: Thay thế `<table>` trên màn hình nhỏ bằng danh sách thẻ (`mobile card`) hiển thị rõ thông tin trọng tâm: tên khách, mã đơn, mẫu hoa, số tiền và nút hành động nhanh.
  - **Thanh điều hướng dưới đáy (Bottom Navigation)**: Giúp người dùng chuyển tab nhanh trên điện thoại mà không cần với tay lên góc trên.
  - **Nút hành động nổi (Floating Action Button - FAB)**: Luôn dễ tiếp cận để tạo đơn mới hoặc thêm chi phí.
  - **Bộ lọc dạng swipe ngang**: Các tab lọc (`filter-tabs`) và pills ngày tháng (`quick-date-pills`) hỗ trợ vuốt ngang mượt mà (`overflow-x: auto; -webkit-overflow-scrolling: touch;`).
  - **Kích thước vùng chạm (Touch Targets)**: Các nút bấm, icon thao tác phải có kích thước tối thiểu `44px x 44px` hoặc có vùng đệm đủ lớn để chạm chính xác.
  - **Modal / Bottom Sheet**: Modal trên mobile phải có chiều rộng tối đa 95%, tự động cuộn nội dung khi dài, nút đóng rõ ràng và nút bấm Lưu/Hủy cố định dễ thao tác.

---

## 3. Chống Phóng To (No Zoom) Khi Nhập Dữ Liệu Trên Mobile

- **Nguyên nhân**: Trình duyệt trên di động (đặc biệt là iOS Safari) tự động phóng to (zoom in) toàn màn hình khi người dùng chạm vào ô nhập liệu (`<input>`, `<select>`, `<textarea>`) có cỡ chữ nhỏ hơn 16px, làm vỡ khung nhìn và gây khó chịu.
- **Quy chuẩn bắt buộc**:
  1. **Cỡ chữ ô nhập liệu trên mobile**: Bắt buộc mọi thẻ `input`, `select`, `textarea` trên màn hình mobile (< 768px) phải có cỡ chữ tối thiểu `16px` (`font-size: 16px !important`).
  2. **Viewport Meta Tag**: Tại file `index.html`, thẻ viewport phải được thiết lập đầy đủ:
     ```html
     <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
     ```
  3. **Touch Action**: Thêm `touch-action: manipulation;` cho các phần tử tương tác để loại bỏ độ trễ nhấn đúp và hạn chế thao tác zoom vô ý.
