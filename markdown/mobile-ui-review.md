# Kiểm tra giao diện mobile — 07/10/2026

## Điều chỉnh thiết kế

- Thay các ký tự icon Unicode bằng một bộ SVG có cùng nét và màu, tránh iOS hiển thị emoji màu.
- Dùng đường nhấn vàng ở slogan và điểm phân cách hình thoi ở dải chữ.
- Dùng icon mở rộng ảnh cho thẻ thành viên; icon mũi tên cho điều hướng/liên hệ.
- Bỏ nhãn CCFC đè lên ảnh đội, giảm khoảng trống trước ảnh và chỉnh khoảng cách hai dòng tiêu đề tiếng Việt.
- Bỏ các dòng vị trí “Chưa cập nhật” trong lưới thành viên; vẫn hiển thị số áo/vị trí khi có dữ liệu thật.
- Làm gọn nút liên hệ cố định và ẩn khi Hero, khung giới thiệu hoặc form liên hệ xuất hiện để tránh che nội dung điều khiển.
- Controls giới thiệu và lightbox có vùng chạm 44 × 44px. Input trên mobile dùng font 16px.

## Kiểm tra thực hiện

| Môi trường | Kích thước | Kết quả |
| --- | --- | --- |
| Chromium, mobile viewport | 360, 375, 390, 430px | Đạt |
| Chromium, desktop viewport | 1440px | Đạt |
| WebKit, mô phỏng iPhone SE | 320px | Đạt |
| WebKit, mô phỏng iPhone 13 | 390px | Đạt |
| WebKit, mô phỏng iPhone 14 Pro Max | 430px | Đạt |

- Không tràn ngang, không lỗi JavaScript/console; Montserrat tải thành công.
- Các icon hiển thị bằng SVG, không còn ký tự emoji dùng làm icon.
- Nút liên hệ cố định ẩn đúng ở Hero, khung giới thiệu và form.
- Điều hướng cầu thủ, tự chuyển 2 giây, tạm dừng, lightbox, vuốt chuyển ảnh/vuốt đóng và form mẫu hoạt động.
- `prefers-reduced-motion` dừng autoplay mặc định và bỏ chuyển động.
- Đã xem ảnh chụp Hero, khung giới thiệu, lưới thành viên, thống kê, liên hệ và lightbox để rà bố cục, khoảng trắng, chữ, icon và vị trí ảnh.
- Build production thành công; kiểm tra diff không có lỗi whitespace.

Đây là kiểm tra bằng engine WebKit/Chromium và mô phỏng thiết bị, chưa kiểm tra trên iPhone vật lý hoặc Messenger WebView thật.

Ảnh chụp được lưu tạm ở `/tmp/fc-mobile-review/`.
