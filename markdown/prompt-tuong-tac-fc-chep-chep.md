# Prompt: Tương tác dành cho FC Chẹp Chẹp

Áp dụng cho **project Angular hiện có**, không khởi tạo lại website. Ưu tiên không cần server riêng, không yêu cầu khách đăng ký/đăng nhập; lần đầu tương tác chỉ hỏi tên hiển thị.

Có hai giai đoạn:

1. **Giao diện và dữ liệu local:** dùng state/localStorage, không thêm backend hay dịch vụ ngoài.
2. **Dữ liệu dùng chung — tùy chọn:** nối Supabase khi người dùng muốn các thiết bị cùng nhìn thấy cảm xúc, đánh giá và bình luận.

**Phân biệt rõ:** localStorage chỉ lưu trên trình duyệt đó. Người khác, máy khác hoặc trình duyệt khác không nhìn thấy những tương tác này. Muốn có bình luận và số đếm dùng chung cần một nơi lưu dữ liệu trực tuyến; Supabase là backend dịch vụ dù không phải tự viết server.

## Bối cảnh project

- Angular 21, TypeScript, Angular CLI, standalone components; state hiện dùng `signal` và `computed`.
- Tailwind CSS 4 và CSS trong `src/styles.css`; animation dùng CSS + IntersectionObserver, không có React hoặc Framer Motion.
- Font Montserrat tự lưu trong project, hỗ trợ tiếng Việt.
- Giao diện poster bóng đá: nền giấy/grunge, trắng ngà, vàng `#c4b074`, đen `#23241f`, chữ lớn và ảnh thành viên.
- `src/app/app.component.ts` / `.html`: Hero, giới thiệu cầu thủ tự đổi mỗi 2 giây, lưới thành viên, bảng ghi bàn, lịch sử trận, tin tức, liên hệ và footer.
- `src/app/icon.component.ts`: bộ icon SVG thống nhất; không dùng ký tự Unicode cho icon điều khiển vì iPhone có thể hiển thị thành emoji màu.
- `src/app/photo.directive.ts`, `src/app/reveal.directive.ts`: hiệu ứng tải ảnh và xuất hiện khi cuộn.
- `src/services/content.ts`: lớp đọc dữ liệu nội dung hiện tại.
- `src/data/members.json`: danh sách thành viên, dùng **`member.id`** làm khóa ổn định. Không dùng tên hoặc thứ tự trong lưới làm khóa bình luận.
- `src/data/scorers.json`, `matches.json`, `news.json`, `stats.json`: giữ dữ liệu nội dung độc lập với tương tác.
- Có lightbox ảnh với Escape, phím trái/phải, giữ focus trong modal, khóa cuộn trang và vuốt ngang/vuốt xuống.
- Có CTA liên hệ cố định trên mobile, được ẩn tại một số section để tránh che nội dung.
- Deploy Vercel: `npm ci`, `npm run build`, output `dist/fc-chep-chep/browser`.
- Chạy local bằng `npm start` hoặc `npm run dev`, cổng 5173.

## Prompt 1: Giao diện và dữ liệu local

Copy nội dung dưới đây khi bắt đầu triển khai giai đoạn 1.

```text
Hãy thêm chức năng cảm xúc, đánh giá/góp ý cho đội và bình luận/cảm xúc cho từng cầu thủ vào project FC Chẹp Chẹp đang có.

ĐỌC PROJECT TRƯỚC
- Đọc package.json, src/app/app.component.ts, src/app/app.component.html, src/app/icon.component.ts, src/styles.css, src/services/content.ts và src/data/members.json.
- Đây là Angular 21 + TypeScript + standalone components + Tailwind CSS 4. Dùng signals/computed phù hợp với code hiện tại.
- Giữ nguyên nội dung, thứ tự tương đối và các chức năng đang có: autoplay 2 giây, ảnh/lightbox, bảng ghi bàn, lịch sử trận, tin tức, liên hệ Instagram/Zalo/gọi điện và footer.
- Không khởi tạo project mới, không đổi framework, không thêm React, Framer Motion, Supabase hoặc API ở bước này.

PHẠM VI VÀ CẤU TRÚC
- Chỉ làm UI và lưu localStorage; không giả vờ đã gửi lên server.
- Tạo lớp tương tác TypeScript ở src/services/interactions.service.ts, tách khỏi content.ts.
- Định nghĩa type rõ ràng cho visitor, reaction, review, comment và target (team/player).
- UI gọi một API service có khả năng bất đồng bộ ngay từ đầu để sau này đổi nguồn dữ liệu mà không phải thiết kế lại giao diện.
- Các thao tác chính: đọc/tạo visitor local, đổi tên, đọc thống kê, đọc cảm xúc đã chọn của visitor, bật/tắt cảm xúc, gửi đánh giá, gửi bình luận, tải thêm danh sách.
- Có thể tách components vào src/app/interactions/ cho thanh cảm xúc, bottom sheet, form đánh giá và danh sách bình luận. Không dồn toàn bộ tính năng vào AppComponent hoặc tạo kiến trúc quá phức tạp.
- Khóa localStorage có prefix fc-chep-chep:interactions:v1. Có version để xử lý dữ liệu cũ.
- Bắt lỗi JSON hỏng hoặc localStorage bị chặn; trang vẫn chạy, dùng bộ nhớ tạm và thông báo ngắn nếu không lưu được.

NGƯỜI DÙNG KHÔNG CẦN ĐĂNG NHẬP
- Lần đầu thực hiện hành động ghi, hiện bottom sheet hỏi “Tên hiển thị”. Trim, yêu cầu 1–30 ký tự.
- Tạo visitor ID bằng crypto.randomUUID(), lưu cùng tên trong localStorage; không dùng tên làm ID.
- Sau khi lưu tên, tiếp tục thao tác người dùng vừa chọn. Nếu hủy, không tự gửi đánh giá, bình luận hoặc cảm xúc.
- Các lần sau dùng lại tên, có mục “Đổi tên”. Đổi tên không tạo visitor mới hay làm mất tương tác đã chọn.
- Đây là định danh theo trình duyệt, không phải xác minh danh tính. Xóa dữ liệu trình duyệt sẽ mất định danh và dữ liệu local.

CẢM XÚC CHO ĐỘI
- Thêm thanh cảm xúc ngay sau phần nội dung Hero, trước hoặc trong một khối tương tác riêng liền kề; không chèn nút lên ảnh hoặc che mặt cầu thủ.
- Có 5 loại: bóng đá, bùng cháy, vỗ tay, yêu thích, vui vẻ. Dùng ID ổn định: football, fire, applause, heart, laugh.
- Ưu tiên SVG nhất quán với icon.component.ts cho các loại cảm xúc và sao. Giữ màu/nét phù hợp bảng màu website, không dùng emoji làm icon điều hướng.
- Mỗi visitor có thể chọn nhiều loại, nhưng mỗi loại chỉ được tính 1 lần trên từng đối tượng. Chạm lại cùng loại để bỏ chọn.
- Có số đếm và trạng thái đã chọn rõ ràng; nhãn truy cập và aria-pressed phù hợp.
- Hiệu ứng nhấn/nảy hoặc icon bay lên ngắn, tiết chế; chỉ animate transform/opacity, không chạy liên tục.

ĐÁNH GIÁ VÀ GÓP Ý CHO ĐỘI
- Hiển thị điểm trung bình 1–5 sao và số lượt; khi chưa có đánh giá thật hiển thị trạng thái trống, không hiện điểm giả như dữ liệu thật.
- Chạm “Đánh giá đội” mở bottom sheet: chọn 1–5 sao, tên hiển thị, góp ý tối đa 300 ký tự và nút gửi.
- Với phạm vi này, mỗi visitor gửi tối đa một đánh giá cho đội. Đã gửi thì hiển thị đánh giá của họ, không cho gửi thêm để tăng số lượt. Chưa làm sửa/xóa đánh giá.
- Góp ý phải có nội dung sau khi trim. Tên lưu cùng từng đánh giá là tên lúc gửi; đổi tên không sửa các bài cũ.
- Danh sách mới nhất trước, 5 mục mỗi lần, có “Xem thêm”. Mỗi thẻ gồm tên, số sao, nội dung và thời gian tiếng Việt.
- Có thông báo “Bản thử nghiệm: tương tác chỉ lưu trên trình duyệt này” ở khối tương tác, không gây hiểu nhầm là bình luận cộng đồng.

TƯƠNG TÁC TỪNG CẦU THỦ
- Đọc danh sách hiện tại từ members.json, dùng member.id làm player_id. Không hard-code số lượng cầu thủ.
- Trong lightbox: tên/thông tin cầu thủ, thanh cảm xúc và nút “Bình luận”. Giữ ảnh lớn và bố cục thoáng trên màn hình nhỏ.
- Nút bình luận mở bottom sheet có danh sách và ô nhập tối đa 200 ký tự. Tải 5–10 mục/lần.
- Trên thẻ thành viên, hiển thị tổng cảm xúc/bình luận bằng một hàng nhỏ dưới tên; không đặt lên mặt hoặc chiếm chỗ icon mở ảnh.
- Chuyển cầu thủ cập nhật đúng target và cảm xúc đã chọn. Không mang danh sách bình luận/draft của cầu thủ trước sang người tiếp theo.
- Tương tác trong sheet không kích hoạt thao tác mở thẻ ảnh phía dưới.

KIỂM TRA DỮ LIỆU VÀ TRẠNG THÁI
- Trim tên và nội dung, kiểm tra rating nguyên 1–5, tên tối đa 30, góp ý tối đa 300, bình luận tối đa 200 ký tự.
- Hiển thị số ký tự và lỗi ngay cạnh trường tương ứng. Không cho gửi nội dung rỗng.
- Chặn gửi review/comment liên tiếp của cùng visitor trong 30 giây; không áp dụng cooldown 30 giây cho việc bật/tắt cảm xúc.
- Không cho gửi trùng khi đang xử lý. Optimistic update cho cảm xúc có hoàn tác nếu service lỗi; các thao tác trên cùng nút cần chống đếm sai khi chạm nhanh.
- Chỉ render chữ bằng interpolation Angular; không dùng innerHTML/bypassSecurityTrustHtml cho nội dung người dùng.
- Giới hạn danh sách local hợp lý, tránh lưu dữ liệu vô hạn. Chặn spam ở local chỉ là hỗ trợ UX, không bảo vệ dữ liệu dùng chung.
- Dữ liệu mẫu nếu cần đặt trong src/data/interactions-demo.json, đánh dấu bản demo; không trộn vào số đếm/điểm đánh giá thật hoặc seed lại mỗi lần reload. Bản dùng thực tế mặc định bắt đầu từ 0.

BOTTOM SHEET VÀ MOBILE
- Theo phong cách nền giấy, trắng ngà/vàng/đen, Montserrat và SVG hiện có. Không thêm gradient rực rỡ, emoji trang trí hoặc shadow nặng.
- Mobile-first 360–430px, kiểm tra thêm 320px; touch target tối thiểu 44px, input/textarea font 16px, safe-area và bàn phím mobile.
- Dùng một cơ chế quản lý sheet/focus thống nhất. Sheet có nút đóng, nhãn dialog, focus trap, Escape và trả focus về nơi mở.
- Khi sheet nằm trên lightbox, Escape/Tab thuộc sheet trên cùng. Sửa handler document hiện tại để không tranh focus hoặc đóng cả lightbox cùng lúc.
- Vuốt xuống để đóng từ tay nắm/header, không từ vùng đang cuộn danh sách hoặc nhập nội dung. Touch event trong sheet không kích hoạt vuốt đổi/đóng ảnh của lightbox phía dưới.
- Đóng sheet bình luận vẫn giữ lightbox và khóa cuộn trang. Chỉ mở lại cuộn khi lớp modal cuối cùng đóng; khôi phục trạng thái overflow ban đầu.
- CTA liên hệ cố định ẩn khi bất kỳ dialog/sheet nào mở.
- Autoplay cầu thủ tạm dừng khi dialog/sheet mở; sau khi đóng, giữ đúng trạng thái bật/tắt do người dùng lựa chọn. Không bật lại nếu họ đã bấm tạm dừng.
- Khi prefers-reduced-motion bật, bỏ hiệu ứng bay/nảy/trượt; giữ hành vi hiện tại là autoplay tắt mặc định.

KIỂM TRA VÀ BÀN GIAO
- npm run build thành công; npm start/npm run dev vẫn hoạt động.
- Kiểm tra chức năng quan trọng: popup tên lần đầu, hủy, đổi tên, reload giữ dữ liệu, chọn/bỏ cảm xúc, chống đếm trùng khi chạm nhanh, một đánh giá/visitor, giới hạn ký tự, cooldown và phân trang.
- Kiểm tra riêng tương tác giữa sheet/lightbox: Escape, Tab, khóa cuộn, vuốt, chuyển cầu thủ, CTA và autoplay.
- Kiểm tra mobile 320/360/390/430px và desktop: không tràn ngang, không che mặt, không che nút bởi CTA/bàn phím. Chụp và xem từng trạng thái sheet, lightbox, thẻ và góp ý để rà thẩm mỹ, không chỉ kiểm tra DOM.
- Kiểm tra Chromium và WebKit mô phỏng iPhone nếu môi trường cho phép; báo rõ phần chưa kiểm tra trên thiết bị vật lý.
- Tóm tắt các file đổi, cách thử, cách reset dữ liệu local và giới hạn “chỉ lưu trên trình duyệt”. Chỉ bàn giao giai đoạn 1; không tự nối Supabase hoặc deploy.
```

## Prompt 2: Dữ liệu dùng chung với Supabase — tùy chọn

Chỉ dùng khi người dùng yêu cầu dữ liệu cộng đồng dùng chung và đã chuẩn bị dự án Supabase. Không tự chuyển sang giai đoạn này sau khi hoàn thành Prompt 1.

```text
Nối chức năng tương tác đã làm ở giai đoạn 1 của FC Chẹp Chẹp với Supabase.

PHẠM VI
- Angular 21 + TypeScript hiện có; giữ giao diện và contract của interactions.service.ts.
- Không viết server riêng, không chuyển toàn bộ dữ liệu thành viên/trận đấu/tin tức sang database.
- Được thêm Supabase client, adapter service, cấu hình client, package dependency và SQL migration cần thiết. Không hứa “chỉ sửa một file” vì còn cần cấu hình và migration.
- Khi mở bản cộng đồng, thay chú thích local/demo bằng trạng thái đúng. Không tự đưa dữ liệu mẫu hoặc bình luận local cũ lên Supabase.

ĐỊNH DANH VÀ CẤU HÌNH
- Khách không cần nhập email/mật khẩu hoặc đăng ký. Khi bắt đầu tương tác ghi, dùng Supabase anonymous sign-in và giữ session; không tạo user mới mỗi lần mở sheet.
- Visitor ID có thẩm quyền là auth.uid() từ session Supabase, không phải UUID tự gửi từ localStorage ở giai đoạn 1.
- Anonymous user sau sign-in mang role authenticated; không nhầm với role anon dùng cho khách chưa có session.
- Tên hiển thị vẫn lấy từ popup, không phải danh tính đã được xác minh. Mất session/xóa dữ liệu trình duyệt có thể tạo một visitor khác.
- Frontend chỉ dùng project URL và publishable key hoặc legacy anon key. Các giá trị đó là public; bảo vệ dữ liệu bằng RLS/quyền database. Tuyệt đối không đưa secret key/service_role/database password vào bundle.
- Angular CLI không tự đọc .env theo cách Vite làm. Thiết lập rõ một phương án build-time sinh client config hoặc Angular environments; chỉ đưa cấu hình public vào client. Nếu dùng .env/Vercel env, phải có bước đọc/sinh cấu hình thật, không dùng import.meta.env hay process.env trực tiếp trong component trình duyệt.
- Có cấu hình mẫu và hướng dẫn local/Vercel. Không commit secret hoặc file chứa session.

DATABASE: SQL MIGRATION
- reactions: id, target_type ('team'|'player'), target_id, reaction_type (5 loại đã định nghĩa), visitor_id UUID, created_at.
  UNIQUE(target_type, target_id, reaction_type, visitor_id).
- reviews: id, target_id, visitor_id UUID, display_name, rating, content, hidden DEFAULT false, created_at.
  UNIQUE(target_id, visitor_id) để mỗi visitor đánh giá đội một lần.
- comments: id, player_id, visitor_id UUID, display_name, content, hidden DEFAULT false, created_at.
- Cả reviews và comments đều phải có visitor_id; không thiếu trường này trong schema rồi dùng nó trong policy.
- NOT NULL và CHECK: tên trim 1–30 ký tự; rating số nguyên 1–5; góp ý trim 1–300; bình luận trim 1–200; target_type/reaction_type chỉ nhận enum cho phép.
- Target đội cố định, ví dụ team:fc-chep-chep. Với player, kiểm tra player_id hợp lệ bằng bảng tham chiếu ID thành viên được seed từ members.json hoặc RPC có allowlist được quản lý. Không cho tạo bình luận cho ID tùy ý.
- Timestamp phía database, không tin thời gian do trình duyệt gửi.
- Tạo index cho target/player_id, created_at, visitor_id và các truy vấn phân trang.

QUYỀN TRUY CẬP VÀ GHI DỮ LIỆU
- Bật RLS cho cả ba bảng. Chưa đăng nhập chỉ được đọc nội dung công khai; anonymous authenticated user được ghi trong quyền cho phép.
- Lấy visitor_id từ auth.uid(); cấm giả visitor khác. Khách chỉ bật/tắt cảm xúc của mình; không sửa/xóa cảm xúc người khác.
- Khách không được sửa/xóa review/comment, không được đặt hidden=true/false hoặc tự quyết định created_at. Dùng RPC ghi với tham số được giới hạn, hoặc khóa quyền ghi cột tương đương.
- Nội dung hidden không được trả cho khách và không tham gia tổng lượt/điểm trung bình.
- Read API trả DTO công khai: tên, nội dung, rating, thời gian, ID bài; không trả visitor UUID/session hoặc thông tin auth cho mọi người.
- Đếm cảm xúc và tính điểm trung bình bằng RPC/view được cấu hình quyền đúng. Có API riêng đọc cảm xúc đã chọn của auth.uid(); không mở toàn bộ bảng để frontend tải rồi tự đếm.
- Nếu dùng SECURITY DEFINER, kiểm tra auth.uid(), đặt search_path rõ, thu hẹp quyền EXECUTE và chỉ trả dữ liệu được phép. Không vô tình bypass RLS để lộ các dòng hidden.
- Admin chỉ được định nghĩa bằng dữ liệu/quyền phía server không do visitor tự sửa, chẳng hạn app_metadata quản trị. Chưa làm /admin ở bước này; hướng dẫn kiểm duyệt trong Supabase Dashboard bằng tài khoản quản trị.

CHỐNG SPAM VÀ ĐỘ TIN CẬY
- Kiểm tra cooldown 30 giây cho review/comment tại database/RPC, không chỉ ở Angular.
- Kiểm tra và ghi trong thao tác atomic có khóa/đồng bộ phù hợp để hai request đồng thời không vượt cooldown. Phạm vi cooldown thống nhất với giai đoạn 1.
- Kiểm tra unique reaction/review bằng ràng buộc database; phản hồi trùng phải cập nhật UI đúng thay vì tăng số đếm lần nữa.
- Anonymous session không đảm bảo một người chỉ có một visitor. Cấu hình chống lạm dụng cho anonymous sign-in (CAPTCHA/Turnstile theo hỗ trợ Supabase), giới hạn ghi và giới hạn dữ liệu đọc; nêu rõ giới hạn chống spam còn lại.
- Khi gửi lỗi: báo ngắn gọn, giữ draft, hoàn tác optimistic state và cho thử lại. Không tự chuyển sang local rồi báo thành công như đã gửi cộng đồng.
- Danh sách phân trang 5–10 mục, thứ tự ổn định theo created_at và id. Đừng tải toàn bộ bình luận cho tất cả cầu thủ ngay khi vào trang.
- Giữ xử lý XSS dạng chữ thuần; không render HTML người dùng cung cấp.
- Sau khi gửi hoặc bật/tắt cảm xúc, cập nhật lại dữ liệu cần thiết. Realtime không bắt buộc ở bản đầu, tránh thêm complexity không cần thiết.

KIỂM TRA VÀ BÀN GIAO
- Hai trình duyệt/session riêng nhìn thấy cùng tương tác; session thứ hai không sửa/xóa được dữ liệu của session đầu.
- Kiểm tra giả visitor_id, ID cầu thủ không hợp lệ, hidden, đánh giá trùng, vượt độ dài, gửi đồng thời/cooldown và lỗi mạng.
- Kiểm tra phân trang, rollback, focus/gesture/modal và giao diện mobile như giai đoạn 1.
- npm run build thành công; cấu hình chạy local và build Vercel rõ ràng.
- Bàn giao migration SQL, service/adapter, cấu hình mẫu, hướng dẫn bật anonymous sign-in, điền public config, kiểm duyệt và giới hạn gói đang dùng.
- Không tự thêm GitHub Actions để giữ dự án free hoạt động. Ghi nhận khả năng dự án bị pause/hạn mức theo chính sách hiện hành và hướng dẫn xử lý nếu xảy ra; không hứa miễn phí hoặc không bị pause vĩnh viễn.
- Không tự tạo UI /admin, tự nhập dữ liệu local lên cloud hoặc publish deployment khi chưa nằm trong yêu cầu triển khai.
```

## Tài liệu tham chiếu

- [Angular build environments](https://angular.dev/tools/cli/environments): cấu hình build theo môi trường.
- [Supabase anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous): session ẩn danh và phân biệt role `authenticated`/`anon`.
- [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys): public/publishable key và secret key.
- [Supabase securing your data](https://supabase.com/docs/guides/database/secure-data): quyền database và giới hạn key trên frontend.

File này là **prompt triển khai**, không có nghĩa các chức năng tương tác đã được thêm vào website. Chọn Prompt 1 khi muốn làm bản local không backend; Prompt 2 dùng khi cần dữ liệu dùng chung.
