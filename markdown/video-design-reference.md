# Thiết kế theo video FC Chẹp Chẹp

Nguồn: `video/igexport-DdBRAKKuHC0.mp4` — thời lượng 77,3 giây, 1280 × 720, 30 fps.

## Nhận diện từ video

- Nền giấy nhăn, hạt in halftone và vệt mực/grunge ở mép.
- Bảng màu trắng ngà, vàng áo đấu, đen than; một vài đoạn chuyển cảnh có hiệu ứng đổi màu.
- Chữ in hoa lớn, xen kẽ chữ đặc và chữ viền; tên nằm sau ảnh cầu thủ tách nền.
- Bố cục ảnh và tên xếp thành nhiều lớp; bảng tên nghiêng như miếng giấy dán.
- Giới thiệu từng cầu thủ qua các poster sáng, vàng, tối; chuyển cảnh nhanh bằng trượt, phóng và lớp phủ.

## Áp dụng vào website

- Hero: tên đội cực lớn, slogan chữ viền, ảnh cả đội phía trước, nhãn CCFC nghiêng và nút giao lưu.
- Texture giấy và logo trích từ khung hình cuối video; texture lấy vùng không có chữ/logo để tránh lặp nội dung trong nền.
- Khung giới thiệu thành viên: tên lớp sau, ảnh lớp trước, nhãn nghiêng; nút trước/sau và vuốt ngang. Tự đổi mỗi 2 giây; nút trái/phải hoặc vuốt đổi hướng tự chạy. Có nút tạm dừng; mặc định dừng khi bật prefers-reduced-motion.
- Lưới thành viên: poster xen kẽ trắng/vàng/đen, giữ 2 cột trên điện thoại và lightbox.
- Liên hệ và footer dùng cùng kiểu chữ, bảng màu và đường viền.
- Chuyển động chỉ dùng transform/opacity, tôn trọng prefers-reduced-motion; không đưa các đoạn flash/glitch nhanh của video lên website.

Dữ liệu thành viên vẫn đọc từ JSON. Chưa bổ sung tên đầy đủ, số áo hoặc vị trí chưa được xác nhận. Form vẫn là giao diện mẫu, chưa gửi dữ liệu.
