# Nguồn lịch sử trận đấu

Đối chiếu 10 ảnh trong `history/` với ảnh đại diện bài đăng Instagram tương ứng: tất cả khớp. Tên đối thủ, tỉ số và người ghi bàn đọc từ ảnh nguồn; logo cắt trực tiếp từ ảnh.

Ngày dưới đây là **ngày đăng bài**, lấy từ metadata công khai của Instagram. Chưa có xác nhận đây là ngày thi đấu; trường `date` hiện để `null`, `dateVerified` là `false`. Không suy ra ngày trận đấu từ tên file, thời gian tải ảnh hoặc ngày đăng.

| Ngày đăng | Đối thủ | FC Chẹp Chẹp – Đối thủ | Bài nguồn |
| --- | --- | --- | --- |
| 09/04/2026 | Dailoan FC | 7–4 | [Instagram](https://www.instagram.com/p/DW60wjEEo_c/) |
| 08/05/2026 | FCSI | 10–1 | [Instagram](https://www.instagram.com/p/DYFkm_dEj02/) |
| 15/05/2026 | Quê Tôi Móng Cái | 3–0 | [Instagram](https://www.instagram.com/p/DYXnPgkksY2/) |
| 23/05/2026 | Quê Tôi Móng Cái | 2–1 | [Instagram](https://www.instagram.com/p/DYsEUqfEstF/) |
| 05/06/2026 | Đại Phố | 3–4 | [Instagram](https://www.instagram.com/p/DZNm1etkizb/) |
| 09/09/2026 | FC Gọi | 4–0 | [Instagram](https://www.instagram.com/p/DdE2gJsErWb/) |
| 15/09/2026 | XD | 2–8 | [Instagram](https://www.instagram.com/p/DdUNMZSEn7t/) |
| 19/09/2026 | Quê Tôi Móng Cái | 4–0 | [Instagram](https://www.instagram.com/p/DdegKxKEoBj/) |
| 02/10/2026 | Quê Tôi Móng Cái | 3–2 | [Instagram](https://www.instagram.com/p/DeAB5OWkkfO/) |
| 06/10/2026 | TM Cầu Giấy | 10–4 | [Instagram](https://www.instagram.com/p/DeKYZj4Ejwu/) |

Trận với XD đặt logo XD bên trái trên ảnh gốc (8–2), vì vậy tỷ số theo thứ tự FC Chẹp Chẹp – XD là **2–8**.

Tin Clay dùng ảnh `news/tin-tuc.jpg` và nội dung người dùng cung cấp. Không tự thêm ngày xuất bản hoặc dự đoán ngày hồi phục.

Kiểm tra: tổng bàn do danh sách người ghi bàn ghi nhận bằng tỷ số đội trong cả 10 trận; ảnh/logo tồn tại. Lọc tháng, kết quả, trạng thái trống và mở chi tiết đã được kiểm tra trên trình duyệt.

## Lịch thi đấu 08/10/2026

- Poster nguồn: `history/2026_10_08_19:30.jpg`. Poster ghi “7:30PM - THU 08 OCT”; năm 2026 theo tên file người dùng cung cấp, khớp thứ Năm 08/10/2026.
- Đối thủ **Hải sản Hà Đông** do người dùng xác nhận. Logo cá xanh/cam cắt từ bên trái poster; logo vàng bên phải khớp logo FC Chẹp Chẹp hiện có.
- Giờ đá: **19:30, 08/10/2026**, múi giờ Việt Nam (`+07:00`). Sân chưa được cung cấp, không tự suy đoán.
- Người dùng cho biết poster đã đăng Instagram. Truy cập profile chưa lấy được nội dung bài cụ thể; hiện gắn link trang `https://www.instagram.com/chepchepfc/` với nhãn “Theo dõi trên Instagram của đội”, không coi đó là link bài đã đối chiếu.
- Dữ liệu lưu trong matches.json, status `upcoming`, tỷ số `null`; khối lịch hiển thị trước lịch sử và không tính vào thống kê 10 trận đã đá. Khi có kết quả, đổi status thành `played`, điền tỷ số/người ghi bàn và link bài kết quả.

## Kết quả Hải sản Hà Đông — 08/10/2026

- Ảnh kết quả người dùng cung cấp: `results/igexport-DePaHHvEtCB.jpg`, tối ưu thành `public/images/matches/DePaHHvEtCB.webp`.
- Ảnh đặt logo Hải sản Hà Đông bên trái (9), FC Chẹp Chẹp bên phải (2): tỷ số theo thứ tự trên web là **FC Chẹp Chẹp 2–9 Hải sản Hà Đông**.
- Người ghi bàn: **Sứt (MSUT)** và **Cầu Hải**, mỗi người 1 bàn; tổng khớp 2 bàn của đội.
- Giữ ngày/giờ thi đấu đã xác nhận: 19:30 ngày 08/10/2026 (`+07:00`) và ID trận cũ để cập nhật cùng một trận. Không suy đoán ngày đăng bài.
- Link bài kết quả theo mã ảnh: https://www.instagram.com/p/DePaHHvEtCB/.
- Đổi trạng thái sang `played`, thay poster lịch bằng ảnh kết quả; lịch sử hiện có 11 trận.

- BXH ghi bàn cộng 2 bàn vào bảng nền Trận 6: Sứt 9 → 10, thêm Cầu Hải 1; tổng 27 → 29 bàn. Chưa có ảnh/liên kết thành viên của Cầu Hải.
