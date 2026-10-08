# Tổng quan project FC Chẹp Chẹp

> Phân tích ngày 08/10/2026 từ code và cấu hình trong thư mục hiện tại, gồm cả thay đổi chưa commit. Các kế hoạch trong `markdown/` không được xem là chức năng đã triển khai. Trạng thái dịch vụ production: **chưa xác định** (không kiểm tra hệ thống từ xa).

## 1. Mục đích

- Website giới thiệu **FC Chẹp Chẹp**, dành cho người xem đội bóng, người hâm mộ và các đội muốn liên hệ giao lưu: xem đội hình, chân dung, bảng ghi bàn, lịch/kết quả trận đấu và tin đội. Nguồn: [giao diện chính](src/app/app.component.html), [dữ liệu](src/data/).
- Người xem có thể thả 5 loại cảm xúc cho đội/cầu thủ, đánh giá đội 1–5 sao và bình luận cầu thủ. Nhập tên để tạo phiên khách ẩn danh, không có luồng đăng ký tài khoản thông thường. Nguồn: [types](src/services/interactions.types.ts), [adapter Supabase](src/services/supabase-interactions.adapter.ts).
- Liên hệ qua Instagram, điện thoại, Zalo; form giao lưu chỉ là mẫu, chưa gửi/lưu thông tin. Nguồn: [section contact](src/app/app.component.html), hàm `submit()` trong [AppComponent](src/app/app.component.ts).

## 2. Cấu trúc thư mục

| Đường dẫn | Vai trò |
| --- | --- |
| [src/index.html](src/index.html), [src/main.ts](src/main.ts) | HTML gốc, metadata, khởi động Angular vào `app-root`. |
| [src/app/app.component.ts](src/app/app.component.ts), [template](src/app/app.component.html) | Trang chính, xử lý dữ liệu hiển thị, lọc trận, slideshow, lightbox và form mẫu. |
| [src/app/interactions/](src/app/interactions/) | Component cảm xúc/đánh giá/bình luận, hộp thoại, state giao diện và CSS tương tác. |
| [src/app/icon.component.ts](src/app/icon.component.ts), [photo.directive.ts](src/app/photo.directive.ts), [reveal.directive.ts](src/app/reveal.directive.ts) | Icon SVG, đánh dấu ảnh tải xong, hiệu ứng xuất hiện khi cuộn. |
| [src/services/](src/services/) | Đọc JSON; kiểm tra đầu vào, gọi RPC và quản lý phiên Supabase. |
| [src/data/](src/data/) | `members.json`, `matches.json`, `scorers.json`, `news.json`, `stats.json`: nội dung tĩnh. |
| [src/environments/](src/environments/) | URL/public key Supabase cho dev/production và file mẫu. |
| [src/styles.css](src/styles.css), [src/fonts.css](src/fonts.css) | Style toàn cục, responsive, animation, font Montserrat. |
| [public/](public/) | Ảnh WebP, font WOFF2, favicon; được sao chép vào bản build theo [angular.json](angular.json). |
| `img/`, `video/`, `history/`, `news/` | Ảnh/video nguồn tham chiếu; bị loại khỏi Git theo [.gitignore](.gitignore), không nằm trong cấu hình assets build. |
| [supabase/migrations/202610080001_shared_interactions.sql](supabase/migrations/202610080001_shared_interactions.sql) | Schema, bảng, RPC, quyền truy cập, RLS và giới hạn tần suất tương tác. |
| [tests/](tests/), [scripts/](scripts/) | Test service với backend giả; test SQL bằng PostgreSQL chạy trong Docker. |
| [markdown/](markdown/), [README.md](README.md) | Kế hoạch, ghi chú nguồn dữ liệu, review và hướng dẫn; cần đối chiếu code khi xác định trạng thái triển khai. |
| [package.json](package.json), [package-lock.json](package-lock.json) | Scripts, dependencies, phiên bản khóa. |
| [angular.json](angular.json), [tsconfig.json](tsconfig.json), [tsconfig.app.json](tsconfig.app.json), [.postcssrc.json](.postcssrc.json), [vercel.json](vercel.json) | Build/dev server, TypeScript, PostCSS và deploy Vercel. |
| `node_modules/`, `.angular/`, `dist/`, `.vscode/`, `.git/` | Dependencies, cache, đầu ra build, thiết lập IDE và lịch sử Git; không phải phần nghiệp vụ. |

## 3. Tech stack

Phiên bản dưới đây lấy từ [package.json](package.json) và [package-lock.json](package-lock.json), không suy ra từ phiên bản mới nhất bên ngoài.

| Thành phần | Khai báo → bản khóa / cấu hình |
| --- | --- |
| Project | `fc-chep-chep` **0.2.0**, private. |
| Ngôn ngữ | TypeScript `~5.9.3` → **5.9.3**; HTML, CSS, JSON; JavaScript ESM cho scripts; SQL/PLpgSQL cho database. Target **ES2022**, strict TypeScript/template. |
| Angular | Core/Common/Compiler/Platform Browser `^21.2.0` → **21.2.25**; standalone components, Signals. Không có dependency Angular Router. |
| Build | Angular CLI và `@angular/build` `^21.2.0` → **21.2.26**; compiler-cli **21.2.25**. Builder `@angular/build:application`. |
| Style | Tailwind CSS và PostCSS plugin `^4.0.0` → **4.3.3**; PostCSS `^8.5.0` → **8.5.29**. Giao diện chủ yếu dùng CSS class tự viết. |
| Thư viện khác | Supabase JS `^2.109.0` → **2.109.0**; RxJS `^7.8.2` → **7.8.2**; tslib `^2.8.1` → **2.8.1**. |
| Runtime/package manager | Node theo `engines`: `^20.19.0 || ^22.12.0`; npm qua scripts/lockfile, phiên bản npm yêu cầu **chưa xác định**. |
| Backend/API | Supabase Auth anonymous + Data API RPC; client gọi trực tiếp, không thấy server ứng dụng riêng. Nguồn: [adapter](src/services/supabase-interactions.adapter.ts). |
| Database | PostgreSQL qua Supabase; version production **chưa xác định**. Test dùng image `postgres:17-alpine` trong [script database](scripts/test-interactions-database.mjs). |
| Deploy | Cấu hình Vercel: `npm ci` → `npm run build` → phục vụ `dist/fc-chep-chep/browser`; rewrite mọi đường dẫn về `/index.html`. Nguồn: [vercel.json](vercel.json). |

## 4. Luồng hoạt động

1. **Tải ứng dụng:** trình duyệt nhận `index.html`, JS/CSS và assets; [main.ts](src/main.ts) gọi `bootstrapApplication(AppComponent)`. Cấu hình hiện tại là render phía trình duyệt; không thấy entry server/SSR trong [angular.json](angular.json).
2. **Hiển thị nội dung:** [content.ts](src/services/content.ts) import JSON vào bundle; [AppComponent](src/app/app.component.ts) sắp xếp cầu thủ ghi bàn, tách trận sắp tới/đã đá, tính thắng–hòa–thua và nhóm lịch sử theo tháng. Ảnh tải từ `public/images/`; không gọi API nội dung đội bóng.
3. **Đọc tương tác:** component → [InteractionsService](src/services/interactions.service.ts) → [SupabaseInteractionsAdapter](src/services/supabase-interactions.adapter.ts) → RPC `fc_team_stats`, `fc_reviews_page`, `fc_player_stats`, `fc_reaction_summary`, `fc_comments_page`. Khôi phục session trước khi đọc; người xem chưa đặt tên vẫn đọc được, không tự tạo user chỉ để xem.
4. **Đặt tên:** [InteractionUiService](src/app/interactions/interaction-ui.service.ts) mở hộp nhập tên khi thao tác cần danh tính. Adapter dùng `signInAnonymously()` hoặc `updateUser()`; visitor ID lấy từ Auth, tên nằm trong user metadata. Session lưu trong `localStorage`, có bộ nhớ tạm nếu storage lỗi; nội dung tương tác không được lưu thay thế ở local.
5. **Ghi tương tác:** kiểm tra tên 1–30 ký tự, góp ý 1–300, bình luận 1–200, sao 1–5; gọi `fc_set_reaction`, `fc_add_review`, `fc_add_comment`. SQL xác thực visitor, kiểm tra dữ liệu/quyền và ghi `reactions`, `reviews`, `comments`; bảng `fc_private.reaction_rate` hỗ trợ giới hạn tần suất. Nguồn: [service](src/services/interactions.service.ts), [migration](supabase/migrations/202610080001_shared_interactions.sql).
6. **Trả kết quả:** RPC trả JSON DTO/số tổng hợp; service tăng signal `revision`, các component tải lại dữ liệu. Cảm xúc cập nhật lạc quan rồi đồng bộ với server hoặc hoàn tác khi lỗi. Đội hình xếp theo số tim giảm dần, hòa thì giữ thứ tự JSON. Nguồn: [reaction bar](src/app/interactions/reaction-bar.component.ts), [AppComponent](src/app/app.component.ts).
7. **Quy tắc lưu:** mỗi visitor tối đa một đánh giá đội; bình luận/đánh giá cách nhau 30 giây; tối đa 30 thao tác cảm xúc/phút/visitor. Nội dung `hidden` không hiển thị công khai; DTO không trả visitor UUID. Không có subscription Realtime trong adapter: thay đổi từ khách khác không tự đẩy đến trang đang mở. Nguồn: [migration](supabase/migrations/202610080001_shared_interactions.sql), [adapter](src/services/supabase-interactions.adapter.ts).
8. **Giao lưu:** link mở Instagram/Zalo hoặc gọi điện; submit form chỉ đổi thông báo trên giao diện, không đi tới backend. Nguồn: [template](src/app/app.component.html), [submit()](src/app/app.component.ts).

## 5. Frontend

### Thứ tự hiển thị từ trên xuống

Các section chính cùng nằm trong [app.component.html](src/app/app.component.html); không phải các trang riêng.

| Thứ tự | Khu vực | Nội dung / file phụ trách |
| --- | --- | --- |
| 1 | Header | Logo, tên đội, link `#home`, `#members`, `#contact`. |
| 2 | Hero `#home` | Khẩu hiệu, ảnh đội, CTA giao lưu, link `#spotlight`. |
| 3 | Fan zone `#fan-zone` | Đặt/đổi tên → cảm xúc đội → điểm đánh giá/nút đánh giá → lời nhắn, tải thêm. [team-interactions.component.ts](src/app/interactions/team-interactions.component.ts). |
| 4 | Dải chữ đội bóng | Dải trang trí “CHẸP CHẸP FC / ANH EM MỘT ĐỘI…”. |
| 5 | Spotlight `#spotlight` | Poster cầu thủ, mở chân dung, bật/tắt tự chuyển, trước/sau; tự chuyển mỗi 2 giây khi đủ điều kiện. [AppComponent](src/app/app.component.ts). |
| 6 | Đội hình `#members` | 13 thành viên hiện tại; lưới xếp theo tim, mở lightbox; đếm tim/bình luận bằng [member-interactions.component.ts](src/app/interactions/member-interactions.component.ts), dữ liệu [members.json](src/data/members.json). |
| 7 | Ghi bàn `#scorers` | Cầu thủ dẫn đầu, tổng bàn/số cầu thủ, bảng giảm dần theo bàn; nguồn riêng [scorers.json](src/data/scorers.json), không tự tổng hợp từ lịch sử trận. |
| 8 | Trận đấu `#history` | Trận sắp tới → lọc kết quả/tháng → ghi chú ngày chưa xác minh → lịch sử theo tháng; mỗi trận dùng `<details>` mở người ghi bàn, nguồn Instagram và poster. [matches.json](src/data/matches.json). |
| 9 | Tin đội `#news` | Ảnh, chuyên mục, tiêu đề, các đoạn nội dung từ [news.json](src/data/news.json). |
| 10 | Giao lưu `#contact` | Link liên hệ và form mẫu: tên đội, trình độ, sân, thời gian, thông tin liên hệ. |
| 11 | Footer | Thương hiệu, Instagram/Zalo/điện thoại và copyright. |
| Có điều kiện | CTA nổi, lightbox, dialog | CTA tùy vùng đang thấy và modal; lightbox có ảnh, tên, trước/sau, cảm xúc, bình luận. Dialog nhập tên/đánh giá/bình luận: [overlay TS](src/app/interactions/interactions-overlay.component.ts), [HTML](src/app/interactions/interactions-overlay.component.html). |

- **Điều hướng:** anchor `#...` cuộn trong cùng trang; không thấy cấu hình route hay trang `/admin`, trang chi tiết tin/trận riêng. Rewrite Vercel không phải khai báo Angular route. Nguồn: [template](src/app/app.component.html), [main.ts](src/main.ts), [vercel.json](vercel.json).
- **State:** `signal`, `computed`, `effect` quản lý bộ lọc, slideshow, modal, visitor, kết quả API. Service `providedIn: 'root'` chia sẻ state; `revision` kích hoạt tải lại, request ID loại phản hồi cũ. [AppComponent](src/app/app.component.ts), [InteractionsService](src/services/interactions.service.ts), [InteractionUiService](src/app/interactions/interaction-ui.service.ts).
- **Style:** CSS toàn cục trong [styles.css](src/styles.css) và [interactions.css](src/app/interactions/interactions.css), khai báo tại [angular.json](angular.json); màu giấy/xám, vàng, chữ đậm, grid/flex, media queries và reduced-motion. Font tự host qua [fonts.css](src/fonts.css).
- **Hành vi hỗ trợ:** vuốt/phím để đổi ảnh, Escape đóng, quản lý focus và khóa cuộn bằng [ModalStateService](src/app/interactions/modal-state.service.ts); ảnh lazy-load, hiệu ứng qua [PhotoDirective](src/app/photo.directive.ts) và [RevealDirective](src/app/reveal.directive.ts).

## 6. Cách chạy project

Chạy tại thư mục gốc, dùng Node phù hợp `engines` trong [package.json](package.json):

```bash
npm ci
npm run dev                 # hoặc npm start; http://localhost:5173
npm run build               # production → dist/fc-chep-chep/browser
npm run preview             # ng serve cấu hình production, cổng 5173
npm run test:interactions
npm run test:interactions:database  # cần Docker hoạt động; tạo rồi xóa PostgreSQL test
```

- `preview` vẫn là Angular dev server, không phải server phục vụ trực tiếp thư mục `dist`. Nguồn: [package.json](package.json).
- Backend: kiểm tra `supabaseUrl`/`supabasePublishableKey` trong [environment.development.ts](src/environments/environment.development.ts) và [environment.ts](src/environments/environment.ts); cả hai hiện có giá trị cấu hình. Có [environment.example.ts](src/environments/environment.example.ts) để tham khảo. Dev thay file bằng `fileReplacements`; không thấy cơ chế nạp `.env` vào Angular trong cấu hình hiện tại.
- Để chạy với Supabase mới: bật Anonymous sign-ins, chạy toàn bộ [migration](supabase/migrations/202610080001_shared_interactions.sql) bằng quyền chủ project rồi cấu hình URL/public key. Không đưa khóa quản trị vào frontend. Luồng phụ thuộc được thể hiện trong [adapter](src/services/supabase-interactions.adapter.ts).
- **Đã kiểm tra trong lần phân tích:** `npm run test:interactions` đạt **7/7**; `npm run build` thành công, initial bundle **471,54 kB** (ước tính truyền **114,20 kB**). Chưa chạy test Docker/database, chưa kiểm thử UI trình duyệt hoặc Supabase thật; không coi build/service test là bằng chứng deploy hoạt động.

## 7. Nhận xét và phần chưa hoàn thiện

| Nhận xét dựa trên code | Bằng chứng / ảnh hưởng |
| --- | --- |
| Form giao lưu chưa xử lý nghiệp vụ | `submit()` chỉ `preventDefault()` và bật `submitted`; chưa đọc/gửi/lưu trường form, cũng chưa dựng nội dung xem trước. [AppComponent](src/app/app.component.ts), [template](src/app/app.component.html). |
| Chưa triển khai thông báo admin | Không có Edge Function, migration notification hay UI admin trong source hiện tại. [plan-thong-bao-admin.md](markdown/plan-thong-bao-admin.md) ghi rõ là kế hoạch; [migration hiện có](supabase/migrations/202610080001_shared_interactions.sql) chỉ xử lý tương tác. Cấu hình ngoài repository **chưa xác định**. |
| Nội dung còn thiếu và phải cập nhật thủ công | Các trường số áo/vị trí còn `null`/“Chưa cập nhật”; lịch sử có `dateVerified: false`, dùng ngày đăng thay ngày đá; tin có `publishedAt: null`. [members.json](src/data/members.json), [matches.json](src/data/matches.json), [news.json](src/data/news.json). |
| Trạng thái trận không tự đổi theo giờ | `upcomingMatches` chỉ lọc `status === 'upcoming'`; trận vẫn “sắp diễn ra” cho tới khi sửa JSON. [AppComponent](src/app/app.component.ts). |
| Có dữ liệu/helper chưa dùng trên trang | `stats.json` đang toàn số 0; `getStats()` được khai báo nhưng AppComponent không dùng. Bảng ghi bàn là nguồn riêng có nhãn “Trận 6”, chưa xác định có đại diện toàn bộ lịch sử hay không. [content.ts](src/services/content.ts), [stats.json](src/data/stats.json), [scorers.json](src/data/scorers.json). |
| Lấy thống kê cầu thủ phát sinh nhiều RPC | `getPlayerStats()` gọi một RPC tổng và một summary cho mỗi cầu thủ: hiện **14 RPC/lần** cho 13 người, chưa tính component khác; chạy lại theo `revision`. Có thể tăng chi phí mạng khi tương tác nhiều. [interactions.service.ts](src/services/interactions.service.ts). |
| Kiểm tra mã cầu thủ phía SQL chưa đối chiếu danh sách thật | Frontend kiểm tra ID trong `members.json`, nhưng SQL chỉ kiểm tra regex. Client gọi RPC trực tiếp có thể ghi cho ID đúng định dạng nhưng không thuộc đội. [service](src/services/interactions.service.ts), [migration](supabase/migrations/202610080001_shared_interactions.sql). |
| Giới hạn chống lặp theo phiên khách | Một review/visitor và rate limit không tương đương một người thật; session ẩn danh mới có UUID khác. Không thấy CAPTCHA trong luồng đăng nhập. [adapter](src/services/supabase-interactions.adapter.ts), [migration](supabase/migrations/202610080001_shared_interactions.sql). |
| Chưa có cập nhật thời gian thực hoặc thao tác kiểm duyệt trên web | Component tải theo khởi tạo/thao tác và `revision`; không có Realtime subscription. Có cột `hidden`, nhưng không có UI/RPC cho khách sửa/xóa/ẩn bài. [adapter](src/services/supabase-interactions.adapter.ts), [migration](supabase/migrations/202610080001_shared_interactions.sql). |
| Trang chính phụ thuộc dữ liệu ghi bàn không rỗng | `topScorer = scorers[0]`, template truy cập trực tiếp `topScorer.goals/name`; nếu danh sách rỗng sẽ thiếu guard. Hiện JSON có dữ liệu nên đây là rủi ro khi cập nhật. [AppComponent](src/app/app.component.ts), [template](src/app/app.component.html). |
| Phạm vi test còn giới hạn | Có test service với backend giả và test SQL/Docker; chưa thấy bộ test component/E2E trong [tests/](tests/) hoặc script tương ứng ở [package.json](package.json). |
