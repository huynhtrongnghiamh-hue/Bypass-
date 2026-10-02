# POR — Link Bypass

Web bypass link rút gọn. Frontend GitHub Pages, backend Cloudflare Worker.

## Cấu trúc

- `index.html` — giao diện (host trên GitHub Pages)
- `worker.js` — backend (deploy lên Cloudflare Worker)

## Cách dùng

### 1. Deploy Worker

1. Vào https://dash.cloudflare.com
2. Workers & Pages → Create → Worker → đặt tên `por-proxy`
3. Dán nội dung `worker.js` → Deploy
4. Copy URL: `https://por-proxy.<username>.workers.dev`

### 2. Host frontend

1. Tạo repo GitHub public tên `por`
2. Upload `index.html`
3. Settings → Pages → Source: `main` / `/ (root)` → Save
4. Chờ 1 phút, mở `https://<username>.github.io/por/`

### 3. Gắn Worker vào web

1. Mở web, mở mục **Cấu hình Worker proxy**
2. Dán URL Worker → tự lưu
3. Dán link rút gọn → Bypass

## Hỗ trợ

- link4m.com
- link1s.com
- yeumoney.com
- Generic fallback cho mọi site khác

## Giới hạn

Worker free: 10ms CPU/request — site countdown/JS sẽ fail. Cần dùng bản Node + Puppeteer.

## License

MIT
