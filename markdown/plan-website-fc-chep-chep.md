# Plan Website FC Chẹp Chẹp

> Website giới thiệu đội bóng, ưu tiên ảnh thành viên, xem chủ yếu trên điện thoại (mobile-first).

## 1. Mục tiêu

- Giới thiệu đội bằng nhiều ảnh thành viên và khoảnh khắc.
- Hiển thị thống kê bàn thắng, lịch sử trận đấu.
- Có lịch trận sắp tới theo tháng.
- Có thông tin và form liên hệ để các đội khác bắt đôi giao lưu.
- Có trang admin để chỉnh sửa nội dung.

## 2. Cấu trúc trang

| Section | Nội dung |
|---|---|
| **Hero** | Logo, slogan, ảnh cả đội, nút "Bắt đôi giao lưu" |
| **Thành viên** | Lưới ảnh lớn (2 cột trên mobile); chạm vào để xem ảnh full + tên, số áo, vị trí |
| **Gallery** | Ảnh theo trận, vuốt ngang, xem full màn hình |
| **Thống kê** | Vua phá lưới, top kiến tạo, tổng thắng/hòa/thua, tổng bàn thắng |
| **Lịch trận sắp tới** | Xem theo tháng (mục 3) |
| **Lịch sử trận đấu** | Thẻ trận: ngày, đối thủ, tỉ số, người ghi bàn; lọc theo tháng/kết quả |
| **Liên hệ giao lưu** | Form (tên đội, trình độ, sân, thời gian) + nút Zalo / Facebook / gọi |
| **Footer** | Mạng xã hội, địa điểm hay đá |
| **/admin** | Trang quản trị (mục 4) |

## 3. Lịch trận theo tháng

- Dạng **lưới tháng**; ngày có trận có chấm màu, chạm vào để xem chi tiết.
- **Vuốt trái/phải** để đổi tháng, kèm nút ‹ ›.
- **Trạng thái trống** (hiện chưa có lịch): hiện thông báo *"Tháng này chưa có lịch, bắt đôi với tụi mình nhé"* + nút liên hệ.
- Mỗi trận gồm: giờ, sân, đối thủ, trạng thái (Sắp đá / Đã đá).
- Trận đã đá tự chuyển sang Lịch sử trận đấu.

## 4. Trang admin

Frontend thuần không tự lưu dữ liệu, nên dùng dịch vụ có sẵn thay vì tự viết backend.

| Phương án | Admin sửa thế nào | Ưu | Nhược |
|---|---|---|---|
| **Supabase / Firebase** (đề xuất) | Đăng nhập /admin, thêm/sửa trận, thành viên, upload ảnh | Có đăng nhập, lưu ảnh, cập nhật tức thì, miễn phí | Phải học SDK, cấu hình rule bảo mật |
| Google Sheets làm nguồn dữ liệu | Sửa trực tiếp trong Sheets | Hợp với Excel đang dùng, ít code | Không có admin thật, ảnh để chỗ khác |
| Decap CMS (Git-based) | Giao diện sửa file JSON trên GitHub | Không cần database | Cần tài khoản GitHub, lưu chậm |

**Chức năng admin:**

- Đăng nhập (chỉ admin).
- Quản lý thành viên: thêm/sửa/xóa, upload ảnh.
- Quản lý trận đấu: lịch sắp tới, kết quả, người ghi bàn.
- Quản lý gallery.
- **Nhập thống kê từ file Excel/CSV** (dữ liệu hiện đang ghi trong Excel).

## 5. Animation cho điện thoại

Nguyên tắc: không dùng hover, chỉ animate `transform` và `opacity`, tôn trọng `prefers-reduced-motion`.

| Animation | Dùng ở đâu | Cách làm |
|---|---|---|
| Hiện dần khi cuộn (fade + trượt lên) | Mọi section, ảnh thành viên | IntersectionObserver |
| Số chạy tăng dần (count-up) | Bàn thắng, số trận thắng | Chạy 1 lần khi cuộn tới |
| Thanh thống kê chạy đầy | Tỉ lệ thắng, top ghi bàn | Animate `scaleX` |
| Vuốt ngang mượt | Gallery, đổi tháng | CSS `scroll-snap` |
| Chạm để phóng ảnh | Lưới thành viên | Shared-element transition |
| Ảnh mờ rồi nét dần (blur-up) | Mọi ảnh | Ảnh nhỏ mờ tải trước, hợp mạng chậm |
| Nút liên hệ dính đáy màn hình, nhấp nháy nhẹ | Toàn trang | `position: fixed` + pulse |
| Phản hồi khi chạm | Nút, thẻ trận | `:active { transform: scale(.97) }` |
| Hero parallax nhẹ (tùy chọn) | Ảnh đội đầu trang | Bỏ nếu giật trên máy yếu |

## 6. Công nghệ

- **Frontend:** Angular + Angular CLI, Tailwind CSS
- **Animation:** CSS + IntersectionObserver
- **Backend dịch vụ:** Supabase (database + đăng nhập admin + lưu ảnh)
- **Deploy:** Vercel
- **Ảnh:** WebP, lazy load

## 7. Dữ liệu (dự kiến)

| Bảng | Trường chính |
|---|---|
| `members` | id, tên, biệt danh, số áo, vị trí, ảnh, bàn thắng, kiến tạo, số trận |
| `matches` | id, ngày giờ, sân, đối thủ, tỉ số, trạng thái (sắp đá/đã đá), người ghi bàn |
| `gallery` | id, ảnh, match_id (tùy chọn), chú thích |
| `contact_requests` | id, tên đội, trình độ, sân, thời gian đề xuất, liên hệ |

## 8. Lộ trình

| Bước | Việc | Kết quả |
|---|---|---|
| 1 | Dựng khung mobile-first: Hero, Thành viên, Liên hệ | Trang chạy được |
| 2 | Gallery, Lịch sử trận, Thống kê (dữ liệu mẫu JSON) | Đủ nội dung chính |
| 3 | Lịch tháng với trạng thái trống | Có lịch trận |
| 4 | Thêm animation theo mục 5 | Giao diện sống động |
| 5 | Nối Supabase, làm /admin, nhập Excel | Quản trị được nội dung |
| 6 | Deploy Vercel, test trên điện thoại thật | Sẵn sàng đưa lên |

## 9. Đã có / cần chuẩn bị

- [x] Logo, màu áo đội
- [ ] Ảnh thành viên và ảnh gallery
- [ ] Dữ liệu thống kê (đang ghi trong Excel)
- [ ] Thông tin liên hệ (Zalo, Facebook, SĐT)
- [ ] Lịch trận (hiện đang trống)

## 10. Prompt giai đoạn 1: làm giao diện và hình ảnh trước

Copy nguyên đoạn dưới để dán vào công cụ AI (Claude Code, Cursor...). Dữ liệu thật và admin làm ở giai đoạn sau.

```text
Hãy xây dựng website giới thiệu đội bóng "FC Chẹp Chẹp" bằng Angular + Angular CLI + Tailwind CSS.

MỤC TIÊU GIAI ĐOẠN 1: chỉ làm GIAO DIỆN và HÌNH ẢNH. Chưa làm backend, chưa làm admin, chưa nối database. Dữ liệu dùng file JSON mẫu để sau này thay bằng dữ liệu thật mà không phải sửa giao diện.

TÀI NGUYÊN ĐÃ CÓ
- Ảnh cả đội: /public/images/team.jpg
- Ảnh từng thành viên: /public/images/members/ (tên file theo tên thành viên)
- Logo và màu áo đội: dùng làm bảng màu chính của website

YÊU CẦU CHUNG
- Mobile-first: thiết kế cho màn hình điện thoại trước (360-430px), sau đó mới mở rộng lên tablet/desktop.
- Ảnh là nhân vật chính của trang: ảnh lớn, sắc nét, bố cục thoáng.
- Ảnh dùng WebP, lazy load, hiệu ứng mờ rồi nét dần (blur-up) khi tải.
- Giữ code đơn giản, dễ đọc, không over-engineering.

CÁC SECTION (theo thứ tự)
1. Hero: ảnh cả đội full màn hình, logo, slogan, nút "Bắt đôi giao lưu".
2. Thành viên: lưới 2 cột trên mobile, mỗi ô là ảnh lớn kèm tên, số áo, vị trí. Chạm vào ảnh để mở xem full màn hình (phóng từ vị trí ảnh), vuốt để chuyển sang thành viên kế tiếp.
3. Gallery: các ảnh khoảnh khắc, vuốt ngang bằng scroll-snap, chạm để xem full.
4. Thống kê: dùng dữ liệu mẫu (vua phá lưới, top kiến tạo, tổng thắng/hòa/thua, tổng bàn thắng) với số chạy tăng dần và thanh chạy đầy.
5. Lịch trận sắp tới: lưới theo tháng, vuốt trái/phải đổi tháng, ngày có trận có chấm màu. Khi tháng không có trận hiển thị trạng thái trống: "Tháng này chưa có lịch, bắt đôi với tụi mình nhé" kèm nút liên hệ.
6. Lịch sử trận đấu: danh sách thẻ (ngày, đối thủ, tỉ số, người ghi bàn) bằng dữ liệu mẫu.
7. Liên hệ giao lưu: form (tên đội, trình độ, sân, thời gian) chỉ làm giao diện, kèm nút Zalo / Facebook / gọi điện.
8. Footer: mạng xã hội, địa điểm hay đá.

ANIMATION (phải mượt trên điện thoại)
- Không dùng hiệu ứng hover. Chỉ animate transform và opacity.
- Hiện dần (fade + trượt lên) khi cuộn tới từng section và từng ảnh.
- Nút "Bắt đôi giao lưu" dính cố định ở đáy màn hình, nhấp nháy nhẹ.
- Phản hồi khi chạm: nút và thẻ lún nhẹ (scale 0.97).
- Tôn trọng prefers-reduced-motion.

CẤU TRÚC DỮ LIỆU
- Tạo thư mục /src/data với members.json, matches.json, stats.json.
- Giao diện chỉ đọc dữ liệu từ các file này qua một lớp hàm riêng, để sau này đổi sang Supabase chỉ cần sửa lớp đó.
- Dựa vào tên file ảnh trong /public/images/members để tự sinh members.json mẫu.

KẾT QUẢ MONG MUỐN
- Dự án chạy được bằng npm run dev, xem tốt trên điện thoại.
- Giải thích ngắn gọn cấu trúc thư mục và cách thay dữ liệu thật vào các file JSON.
```
TIÊU CHÍ HOÀN THÀNH
- Chạy được bằng npm run dev, không lỗi console.
- Hiển thị tốt ở 360px và 430px, không cuộn ngang ngoài ý muốn.
- Có alt cho mọi ảnh; lightbox đóng được bằng nút và vuốt xuống.
- Làm theo từng bước: sau mỗi bước dừng lại, tóm tắt, rồi chờ tôi xác nhận.