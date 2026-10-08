# Rà soát tương tác — giai đoạn 1

Ngày kiểm tra: 08/10/2026. Phạm vi: Prompt 1, Angular hiện có, UI + localStorage; không Supabase, không deploy.

## Kết quả chức năng

- 6 kiểm thử service đạt qua `npm run test:interactions`: trạng thái rỗng, validation, cảm xúc chạm nhanh/không trùng, target riêng, reload/đổi tên, một đánh giá, cooldown chung 30 giây, tên lịch sử, HTML dạng chữ, phân trang, storage hỏng/bị chặn và giới hạn dữ liệu.
- `npm run build` thành công; `npm start` đang phục vụ tại cổng 5173; `git diff --check` không báo lỗi whitespace.
- Kiểm tra trình duyệt tự động bằng Playwright trên Chromium và WebKit: nhập tên lần đầu, hủy không ghi dữ liệu, trim tên, đổi tên giữ UUID, reload giữ lựa chọn, chọn/bỏ cảm xúc, lỗi trường form, chọn sao bằng bàn phím, một đánh giá và bình luận sau bước nhập tên không gửi trùng.
- Chromium: giả lỗi ghi để kiểm tra rollback cảm xúc; localStorage bị chặn vẫn tương tác trong bộ nhớ và hiển thị cảnh báo; phân trang góp ý/bình luận 5 → 7 mục; cooldown từ đánh giá sang bình luận giữ draft khi bị từ chối.
- Nội dung HTML được hiển thị như chữ, không tạo thẻ ảnh hoặc thực thi script. Dữ liệu test chỉ được đưa vào context trình duyệt kiểm thử; production không seed dữ liệu mẫu.
- Bình luận gắn với `member.id`. Đổi cầu thủ không mang draft/list cũ sang người mới; hàng số đếm nằm dưới tên, không che ảnh.

## Modal và hành vi hiện có

- Escape chỉ đóng sheet trên cùng, vẫn giữ lightbox và khóa cuộn. Đóng lớp cuối cùng mới khôi phục overflow trước khi mở.
- Tab/Shift+Tab giữ focus trong sheet; đóng trả focus về đúng nút mở, kể cả WebKit không tự focus nút khi chạm.
- Vuốt xuống từ header đóng sheet; vuốt ở textarea không đóng hoặc đổi ảnh bên dưới. CTA liên hệ ẩn khi có modal.
- Autoplay tạm dừng khi mở sheet, chạy lại nếu trước đó bật, giữ tắt nếu người dùng đã bấm tạm dừng. Reduced motion vẫn tắt autoplay mặc định.
- Không thay dữ liệu đội hình, trận đấu, ghi bàn, tin tức và thông tin liên hệ.

## Giao diện đã kiểm tra

Chromium: rộng 320, 360, 390, 430 và desktop 1440px. WebKit mô phỏng iPhone: 320, 390, 430px. Chụp các trạng thái khối cổ vũ, đặt tên, đánh giá, lightbox, bình luận; kiểm tra thêm viewport cao 480px để mô phỏng vùng hiển thị bị thu nhỏ.

Đã xem trực tiếp ảnh chụp: không tràn ngang, thanh cảm xúc SVG đồng bộ, ảnh cầu thủ rõ mặt, nút không bị CTA che; input/textarea 16px, nút chính/đóng ít nhất 44px. Sheet dùng nền trắng ngà, nét viền mảnh, chữ Montserrat và màu vàng/đen của website. Header và hàng đặt tên trên mobile được tách dòng để tiêu đề thoáng ở 320px. Đã xem cả trạng thái đánh giá được lưu và sheet bình luận trên lightbox.

Kiểm tra thêm khối đánh giá đã có điểm/số lượt và tên dài ở 320px: không tràn ngang. Đã xem thẻ thành viên 2 cột với hàng tổng cảm xúc/bình luận nằm dưới tên.

Không có page error/console error trong các lượt kiểm tra trên. Playwright và browser test được cài/chạy trong thư mục QA tạm, không thêm vào dependencies production. Script kiểm thử service được giữ trong repository để chạy lại.

## Giới hạn và cách thử

Đây là dữ liệu local trên từng trình duyệt/origin, không phải tương tác cộng đồng. Xóa storage sẽ mất định danh và bài viết local; định danh không xác minh danh tính. Khi không lưu được, dữ liệu chỉ còn trong bộ nhớ của phiên. Không kiểm duyệt/sửa/xóa bài ở giai đoạn này.

Chạy `npm start`, mở `http://localhost:5173`, dùng khối cổ vũ sau Hero và chạm ảnh cầu thủ để thử. Hướng dẫn reset đúng một khóa và cấu trúc file nằm trong README.

Chưa kiểm tra trên điện thoại vật lý, bàn phím iOS thực tế hoặc trình duyệt nhúng Messenger/Zalo. WebKit giả lập và viewport ngắn không thay thế được những kiểm tra đó.
