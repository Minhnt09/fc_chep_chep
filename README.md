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
- Lưới 12 thành viên, 2 cột trên điện thoại; lightbox có nút đóng, phím Escape, phím mũi tên, vuốt ngang và vuốt xuống.
- Form liên hệ chỉ xem trước, chưa lưu/gửi dữ liệu. Thông tin Zalo, Facebook và điện thoại chờ cập nhật.
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
- `src/data/matches.json`, `src/data/stats.json`: khung dữ liệu chờ bước tiếp theo; giá trị 0 hiện chưa hiển thị trên giao diện.
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

`src/data/scorers.json` chứa bảng **Trận 6** theo ảnh người dùng cung cấp (12 cầu thủ, 27 bàn). Cập nhật `label`, `name`, `goals`, `memberId` tại đây; giao diện tự sắp xếp giảm dần và cộng tổng. `memberId` liên kết ảnh thành viên; Silun đã được nối ảnh từ `img/silun/DUY.png`. Ảnh `img/domixi/DM.png` đã thêm vào đội hình với tên DM và biệt danh DOMIXI; Người dùng đã xác nhận DM/Domixi là cầu thủ khác Hadinggg. Hadinggg tiếp tục dùng chữ viết tắt vì chưa có ảnh; thống kê Domixi chưa được cung cấp. Không diễn giải bảng này thành tổng cả mùa hoặc thống kê 6 trận.
