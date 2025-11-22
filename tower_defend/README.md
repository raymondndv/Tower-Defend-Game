# Tower Defend – Công khai và hướng dẫn sử dụng

## Chạy nhanh tại máy bạn
- Yêu cầu: có Python hoặc XAMPP (Apache) trên máy.
- Cách 1 (Python):
  - Mở thư mục dự án `c:\xampp\htdocs\tower_defend`.
  - Chạy: `python -m http.server 8000`.
  - Mở: `http://localhost:8000/tower_defense.html`.
- Cách 2 (XAMPP):
  - Đặt thư mục `tower_defend` trong `htdocs`.
  - Start Apache trong XAMPP.
  - Mở: `http://localhost/tower_defend/tower_defense.html`.

## Public để người dùng truy cập
- GitHub Pages (khuyến nghị, miễn phí):
  1. Tạo repo GitHub mới và push toàn bộ mã nguồn.
  2. Vào Settings → Pages → Deploy from branch → chọn branch `main` và `root`.
  3. Sau khi build xong, truy cập: `https://<username>.github.io/<repo>/tower_defense.html`.
  - Lưu ý: nếu muốn URL ngắn gọn, đổi tên `tower_defense.html` → `index.html`.
- Netlify (miễn phí, kéo thả):
  1. Đăng nhập netlify.com → Add new site → Deploy manually.
  2. Kéo thả thư mục dự án lên.
  3. Netlify tạo URL công khai, ví dụ: `https://<tên-site>.netlify.app/` → mở `tower_defense.html`.
- Vercel (miễn phí):
  1. Import repo từ GitHub vào vercel.com.
  2. Chọn framework “Other” (Static Site). Build Output: thư mục gốc.
  3. Mở URL vercel đã cấp → `tower_defense.html`.
- Tạm thời công khai nhanh bằng Ngrok:
  - Chạy server local (Python hoặc Apache), sau đó chạy: `ngrok http 8000` (hoặc `ngrok http 80`).
  - Dùng URL ngrok công khai chia sẻ cho người chơi.

## Cách chơi – điều khiển
- Chế độ chiến đấu:
  - Chọn tháp, click lên ô đường để đặt tháp.
  - Chuột phải: hủy chọn tháp hiện tại.
  - Tab: chuyển đổi giữa chiến đấu và nông trại.
  - Các map khó tăng dần, nhiều điểm bắt đầu/kết thúc hiển thị bằng hang động/lâu đài.
- Chế độ nông trại:
  - Click ô đất để trồng (chọn loại cây ở thanh dưới).
  - Cây lớn theo thời gian: Cà rốt 60s, Lúa mì 90s, Bí ngô 120s.
  - Tưới nước theo chu kỳ (5/7/10s); bình tưới luôn hiển thị, nổi bật khi đến lúc cần tưới.
  - Thu hoạch khi cây trưởng thành để nhận tiền.
  - Icon cây và vòng tiến độ hiển thị rõ tại ô đã trồng.

## Cấu trúc dự án
- `tower_defense.html` – trang chính.
- `js/` – toàn bộ logic game:
  - `game.js` – vòng lặp game, tích hợp chế độ farm.
  - `input.js` – xử lý bàn phím/chuột, chuyển mode, gieo/trồng/tưới/thu hoạch.
  - `map.js` – vẽ map, hang động/lâu đài, đa đường đi.
  - `config.js` – cấu hình tháp/map/kinh tế.
  - `farm.js` – hệ thống nông trại, hoạt ảnh, vòng tiến độ, bình tưới.
  - `farm-ui.js` – UI nông trại, portal chuyển chế độ, hướng dẫn.

## Mẹo triển khai
- Để URL gốc không cần `tower_defense.html`, đổi tên file thành `index.html` trước khi deploy.
- Kiểm tra console browser nếu có lỗi, đảm bảo đường dẫn script trong HTML trỏ đúng tới `js/`.

## Giấy phép
- Mã nguồn dùng cho mục đích học tập/giải trí. Tùy chỉnh tự do theo nhu cầu.