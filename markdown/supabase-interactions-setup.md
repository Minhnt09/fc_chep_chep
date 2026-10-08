# Thiết lập tương tác dùng chung

Website Angular kết nối trực tiếp Supabase bằng publishable key. Không cần tự viết server. Không có CAPTCHA, cron giữ dự án, trang admin hoặc import dữ liệu local.

## Thiết lập project

1. Mở project `gbjtvclrciqgiwvsutto` trong [Dashboard](https://supabase.com/dashboard).
2. Authentication → Sign In / Providers → bật Anonymous sign-ins. Không bật CAPTCHA cho phạm vi này.
3. SQL Editor → New Query → dán **toàn bộ** `supabase/migrations/202610080001_shared_interactions.sql` → Run. File này tạo schema `fc_private`, ba bảng công khai và các hàm RPC; không tạo bài mẫu. Có thể chạy lại trên schema do migration này tạo. Nếu đã có bảng trùng tên với cấu trúc khác, cần kiểm tra lỗi thay vì xóa bảng.
4. URL và publishable key đã điền trong `src/environments/environment.ts`. URL là `https://gbjtvclrciqgiwvsutto.supabase.co`, không thêm `/rest/v1/`.
5. `environment.development.ts` dùng cùng URL/key để localhost và bản production thấy cùng dữ liệu. Khi đổi project, sao chép nội dung `environment.example.ts`, điền URL/key vào cả environment.ts và environment.development.ts, và cập nhật storageKey trong adapter theo project mới.
6. Chạy `npm start`, mở http://localhost:5173. `npm run build` dùng environment production; không cần env Vercel bổ sung. Chưa tự deploy trong lần triển khai này.

Chỉ URL và publishable key được phép có trong frontend. Không dùng secret/service_role/database password. Angular chọn environment qua file replacement, không đọc `.env` như Vite. Định danh do Supabase Auth cấp, người dùng không tự gửi visitor UUID hoặc timestamp/hidden khi ghi.

Tài liệu: [Anonymous sign-in](https://supabase.com/docs/guides/auth/auth-anonymous), [Database functions](https://supabase.com/docs/guides/database/functions), [Angular environments](https://angular.dev/tools/cli/environments).

## Kiểm tra bằng hai trình duyệt

- A mở localhost, nhập tên, chọn cảm xúc và gửi đánh giá.
- B dùng cửa sổ riêng tư hoặc trình duyệt khác, mở website và tải lại: thấy cùng số đếm/nội dung, nhưng không thấy cảm xúc của A dưới trạng thái đã chọn của B.
- A mở ảnh cầu thủ, gửi bình luận. Nếu vừa gửi đánh giá, cần chờ đủ 30 giây trước khi bình luận. B mở cùng cầu thủ và thấy nội dung.
- A gửi đánh giá lần hai: không có form mới. Hai bình luận liên tiếp: lần sau bị cooldown, giữ nội dung.
- Ngắt mạng khi gửi: hiển thị lỗi, giữ draft; cảm xúc hoàn tác. Không có bản local thay thế báo thành công.
- Local và Vercel có session khách khác nhau nhưng cùng dữ liệu công khai nếu build dùng cùng URL/key. Bản Vercel cũ vẫn lưu local cho tới khi được build/deploy lại.

## Database đang ở đâu?

Dữ liệu tương tác nằm trên PostgreSQL của [project Supabase này](https://supabase.com/dashboard/project/gbjtvclrciqgiwvsutto), không nằm trên Vercel hoặc trong folder SQL. File SQL trong repository là hướng dẫn tạo cấu trúc database.

Đăng nhập tài khoản Supabase có quyền quản lý project → Table Editor → schema `public`:

| Bảng | Nội dung |
| --- | --- |
| `comments` | Bình luận cầu thủ; `player_id` khớp `id` trong members.json |
| `reviews` | Điểm đánh giá và góp ý đội |
| `reactions` | Cảm xúc; tim có `reaction_type = heart`, cầu thủ có `target_type = player` |

Có thể kiểm tra bằng SQL Editor với truy vấn chỉ đọc:

```sql
select id, player_id, display_name, content, hidden, created_at
from public.comments
order by created_at desc
limit 50;
```

Quyền quản trị là quyền của tài khoản Supabase trên project; nhập tên “admin” trên website không cấp quyền đó.

## Kiểm duyệt trong Dashboard

Table Editor → `public.comments` hoặc `public.reviews` → tìm dòng theo tên/nội dung/thời gian. Đặt `hidden = true` để ẩn; tải lại website để kiểm tra. Nội dung bị ẩn không được trả qua RPC/danh sách và không được tính vào thống kê. Có thể đặt lại `hidden = false` để hiện lại.

Để xóa comment: chọn đúng dòng trong `public.comments`, chọn thao tác **Delete/Xóa dòng**, kiểm tra nội dung rồi xác nhận. Có thể xóa dòng bằng Dashboard khi thực sự cần. Nếu xóa đánh giá, visitor đó có thể gửi lại; nếu chỉ ẩn đánh giá, vẫn giữ giới hạn một lần. Không xóa user Auth để reset thử nghiệm: foreign key `ON DELETE CASCADE` sẽ xóa các tương tác liên quan. Tên được lưu tại thời điểm gửi, đổi tên không sửa bài cũ.

Client không được INSERT/UPDATE/DELETE trực tiếp vào ba bảng. Đọc trực tiếp review/comment chỉ được các cột công khai, RLS lọc hidden; visitor_id không có quyền đọc công khai. RPC SECURITY DEFINER đặt search_path rỗng, kiểm tra auth.uid() và claim is_anonymous trước ghi. Khóa transaction theo visitor làm cooldown review/comment atomic, kể cả gửi đồng thời. Rate cảm xúc dùng một bảng nhỏ trong schema không expose `fc_private`.

## Phiên và dữ liệu cũ

Không nhập dữ liệu từ `fc-chep-chep:interactions:v1` lên Supabase. Có thể xóa khóa đó để dọn bản thử cũ. Session hiện tại ở `fc-chep-chep:auth:gbjtvclrciqgiwvsutto`; xóa session chỉ mất định danh trên trình duyệt, không xóa dữ liệu đã gửi trên hệ thống. Nếu trình duyệt chặn lưu session, website báo rõ giới hạn nhưng không lưu review/comment local.

Không có CAPTCHA theo yêu cầu; người dùng vẫn có thể tạo nhiều phiên bằng cách xóa dữ liệu trình duyệt. Giới hạn 30 cảm xúc/phút và cooldown hỗ trợ hạn chế ghi, không đảm bảo một người chỉ có một visitor.

## Khi dự án bị tạm dừng hoặc lỗi cấu hình

- Nếu thấy “Chưa thiết lập dữ liệu tương tác”: chạy migration, chờ schema cache cập nhật rồi bấm “Thử tải lại”.
- Nếu thấy “Chưa bật Anonymous sign-ins”: bật provider trong Authentication.
- Nếu dự án bị paused: vào Dashboard, chọn project và dùng **Restore** nếu còn được hỗ trợ; chờ project hoạt động rồi tải lại website. Không có cron tự đánh thức.
- Không hứa có thể khôi phục vô thời hạn. Khi quá thời hạn khôi phục hoặc Dashboard không còn nút Restore, làm theo hướng dẫn backup/restore hiện hành của Supabase. [Project pausing](https://supabase.com/docs/guides/platform/free-project-pausing), [Restore backup](https://supabase.com/docs/guides/platform/migrating-within-supabase/dashboard-restore).
