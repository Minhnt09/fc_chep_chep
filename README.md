# FC Chẹp Chẹp

Website mobile-first bằng Angular 21, TypeScript và Tailwind CSS. Animation dùng CSS và IntersectionObserver. Toàn bộ giao diện dùng Montserrat, font tự lưu trong `public/fonts/` (hỗ trợ tiếng Việt).

## Chạy dự án

Yêu cầu Node.js 20.19+ thuộc nhánh 20, hoặc nhánh Node tương thích Angular 21.

```bash
npm install
npm start
```

`npm run dev` cũng chạy được như `npm start`.

Mở http://localhost:5173. Dùng IP máy và cổng 5173 để xem bằng điện thoại trên cùng mạng.

```bash
npm run build
npm run preview
```

Build production nằm trong `dist/fc-chep-chep/browser`. `preview` chạy Angular dev server với cấu hình production; không dùng server này để triển khai thực tế.

## Bước 1 đã hoàn thành

- Hero dùng ảnh cả đội, nền giấy/grunge, chữ lớn và tông trắng ngà–vàng–đen theo video giới thiệu.
- Khung giới thiệu cầu thủ dạng poster, tự đổi mỗi 2 giây, đổi hướng bằng nút hoặc vuốt ngang, có nút tạm dừng; chuyển cảnh bằng transform/opacity.
- Lưới 13 thành viên, 2 cột trên điện thoại; lightbox có nút đóng, phím Escape, phím mũi tên, vuốt ngang và vuốt xuống.
- Form liên hệ chỉ xem trước, chưa lưu/gửi dữ liệu. Có liên kết Instagram, Zalo và gọi điện tới 0397655089.
- Hiệu ứng xuất hiện khi cuộn và hỗ trợ giảm chuyển động.

Logo và texture giấy được trích từ video tham chiếu đội cung cấp. Có thể thay logo bằng file gốc sắc nét hơn khi có tài nguyên riêng.

## Cấu trúc và thay dữ liệu

- `src/main.ts`: khởi động Angular standalone.
- `src/app/app.component.ts`: trạng thái và xử lý lightbox, form.
- `src/app/app.component.html`: template các section.
- `src/app/photo.directive.ts`: hiệu ứng ảnh khi tải.
- `src/app/reveal.directive.ts`: hiệu ứng xuất hiện khi cuộn.
- `src/styles.css`: giao diện responsive và Tailwind.
- `src/services/content.ts`: lớp đọc dữ liệu; thay nguồn tại đây khi nối Supabase.
- `src/data/members.json`: cập nhật `name`, `nickname`, `number`, `position`, `image`; số áo chưa rõ dùng `null`.
- `src/data/matches.json`: 11 kết quả trận đấu, đối thủ, logo, người ghi bàn và bài nguồn Instagram.
- `src/data/news.json`: ảnh và nội dung tin tức của đội.
- `src/data/stats.json`: khung thống kê tổng quát chưa hiển thị.
- `public/images/`: ảnh WebP đã tối ưu từ `img/`. Thư mục `img/` giữ nguyên ảnh gốc.
- `public/images/design/`: logo và texture trích từ video tham chiếu.
- `markdown/video-design-reference.md`: phân tích video và hướng thiết kế áp dụng.
- `angular.json`, `tsconfig*.json`, `.postcssrc.json`: cấu hình Angular, TypeScript và Tailwind.
- `markdown/plan-website-fc-chep-chep.md`: kế hoạch đã cập nhật công nghệ sang Angular.

Đặt ảnh mới trong `public/images/members/`, rồi sửa đường dẫn `image` trong JSON thành `/images/members/ten-file.webp`. Tên lấy từ ảnh hiện có; chưa suy đoán số áo hoặc vị trí.

Các bước tiếp theo: Gallery / thống kê / lịch sử → lịch tháng → hoàn thiện animation → Supabase và admin → triển khai Vercel. Dừng sau từng bước theo kế hoạch để xác nhận.

## GitHub và Vercel

`vercel.json` cấu hình Angular, `npm ci`, `npm run build` và output `dist/fc-chep-chep/browser`, cùng fallback cho đường dẫn SPA. Dải Node.js trong `package.json` tương thích Node local 20.19+ và Node 22.12+; khi import trên Vercel chọn Node.js 22.

Repository chỉ cần mã nguồn và ảnh WebP trong `public/`. Ảnh/video gốc, cache, `node_modules`, output build và `.env` không được đưa vào Git.

Sau khi đẩy lên GitHub: vào Vercel → Add New → Project → Import repository → Deploy. Cấu hình build đọc từ `vercel.json`. Những lần push tiếp theo lên nhánh production sẽ được Vercel tự triển khai.

## Thống kê ghi bàn

`src/data/scorers.json` chứa bảng nền **Trận 6** theo ảnh người dùng cung cấp, đã cộng thêm kết quả Hải sản Hà Đông ngày 08/10/2026: Sứt từ 9 lên 10 bàn, thêm Cầu Hải 1 bàn (13 cầu thủ, 29 bàn). Cầu Hải chưa có ảnh thành viên nên `memberId` để `null`. Cập nhật `label`, `name`, `goals`, `memberId` tại đây; giao diện tự sắp xếp giảm dần và cộng tổng. `memberId` liên kết ảnh thành viên; Silun đã được nối ảnh từ `img/silun/DUY.png`. Ảnh `img/domixi/DM.png` đã thêm vào đội hình với tên DM và biệt danh DOMIXI; Người dùng đã xác nhận DM/Domixi là cầu thủ khác Hadinggg. Hadinggg đã có ảnh đại diện từ `img/hadinggg/ha.png` và được nối với bảng ghi bàn; thống kê Domixi chưa được cung cấp. Không diễn giải bảng này thành tổng cả mùa hoặc thống kê 6 trận.

## Icon và kiểm tra mobile

`src/app/icon.component.ts` cung cấp icon SVG dùng chung, không sử dụng ký tự emoji cho nút điều khiển. Xem kết quả rà giao diện tại `markdown/mobile-ui-review.md`.

## Tương tác dùng chung — Supabase

Cảm xúc cho đội/cầu thủ, đánh giá 1–5 sao kèm góp ý và bình luận cầu thủ dùng database Supabase. Khách chỉ nhập tên, không cần email/mật khẩu. Giao diện, ảnh, lightbox và nội dung JSON vẫn giữ trên Angular.

**Cần chạy migration và bật Anonymous sign-ins trước khi dùng.** URL/key public đã cấu hình cho project `gbjtvclrciqgiwvsutto`; localhost và production dùng cùng database. Xem [hướng dẫn thiết lập](markdown/supabase-interactions-setup.md).

- `src/services/interactions.service.ts`: API bất đồng bộ và validation giao diện.
- `src/services/supabase-interactions.adapter.ts`: session ẩn danh, cập nhật tên, RPC và lỗi mạng.
- `src/services/interactions.types.ts`: DTO công khai không chứa visitor UUID của người khác.
- `supabase/migrations/202610080001_shared_interactions.sql`: bảng, RLS, quyền cột, RPC đọc/ghi, cooldown và giới hạn cảm xúc.
- `src/environments/environment.ts`: URL/publishable key production; bản development dùng cùng cấu hình. Angular chọn qua `fileReplacements`, không đọc `.env` tự động.
- `src/app/interactions/`: UI cảm xúc, đánh giá, bình luận và quản lý sheet/focus.

Lưới “Anh em Chẹp Chẹp” xếp theo số cảm xúc `heart` giảm dần; bằng nhau giữ thứ tự trong `members.json`. Số cạnh icon tim là số tim, không phải tổng mọi cảm xúc. Xếp hạng cập nhật sau tương tác và khi tải lại; dùng RPC hiện có, không cần migration mới.

Mỗi phiên khách đánh giá đội tối đa một lần; review/comment dùng chung cooldown 30 giây tại database. Cảm xúc tối đa 30 yêu cầu bật/tắt mỗi phút/visitor. Danh sách tải 5 mục/lần. Bài bị ẩn không hiển thị và không tham gia thống kê. Chưa có CAPTCHA, cron, trang admin hoặc Realtime; trình duyệt khác tải lại để thấy cập nhật.

Khóa local cũ `fc-chep-chep:interactions:v1` không được đọc hoặc tự đưa lên database. Chỉ session Supabase được lưu trên trình duyệt ở khóa `fc-chep-chep:auth:gbjtvclrciqgiwvsutto`. Xóa session không xóa bài đã gửi trên hệ thống; có thể tạo visitor khác khi nhập tên lần sau. Tên hiển thị không xác minh danh tính.

```bash
npm run test:interactions
npm run test:interactions:database  # Cần Docker và image postgres:17-alpine
npm run build
```

Test database chạy trên container riêng và tự dọn, không sửa Supabase production. Biên bản giai đoạn 1 ở `markdown/interactions-stage1-review.md` là lịch sử bản local; bản hiện tại đã thay nguồn dữ liệu. Xem kết quả mới tại `markdown/interactions-stage2-review.md`.

## Lịch sử trận đấu và tin tức

Khối lịch thi đấu hiển thị các trận sắp diễn ra trước lịch sử. Trận Hải sản Hà Đông lúc 19:30 ngày 08/10/2026 đã cập nhật kết quả FC Chẹp Chẹp thua 2–9; Sứt và Cầu Hải mỗi người ghi 1 bàn. Trận có trạng thái `played`, ảnh kết quả và link bài Instagram; được tính vào 11 trận đã đá. Giờ có múi giờ Việt Nam.

Lịch sử nhóm theo tháng, có bộ lọc kết quả và tháng. Chạm thẻ trận để mở người ghi bàn, ảnh kết quả và bài Instagram gốc. Logo và ảnh tối ưu lưu tại `public/images/opponents/`, `public/images/matches/`; ảnh tin tại `public/images/articles/`. Ảnh gốc `history/` và `news/` được giữ trên máy, không đưa vào Git.

`postedAt` là ngày đăng bài đã đối chiếu. Khi xác nhận ngày thi đấu, điền `date` dạng `YYYY-MM-DD`, đặt `dateVerified` thành `true`; giao diện tự dùng ngày đó và bỏ nhãn “Ngày đăng” ở trận tương ứng. Xem bảng nguồn trong `markdown/match-history-sources.md`. Tin Clay hiện chưa có ngày xuất bản được cung cấp.
