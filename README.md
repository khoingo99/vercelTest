# Next.js + Prisma + Neon + Vercel Demo

Dự án demo đơn giản:

- Next.js (App Router, thư mục `app/`)
- Prisma ORM
- Neon Postgres (qua biến môi trường `DATABASE_URL`)
- Có màn hình:
  - Đăng nhập (`/`)
  - Đăng ký (`/register`)
  - Home dashboard (`/home`) hiện danh sách bài viết

> **Lưu ý:** Đây là demo nên mật khẩu đang lưu dạng *plain text* trong DB.
> Tuyệt đối KHÔNG dùng kiểu này cho production. Thực tế cần hash mật khẩu
> (bcrypt/bcryptjs, Argon2...).

## Cài đặt & chạy local

1. Cài dependencies:

```bash
npm install
```

2. Tạo file `.env` từ `.env.example` và điền `DATABASE_URL` là chuỗi kết nối Neon Postgres của bạn:

```bash
cp .env.example .env
```

3. Chạy migrate để tạo bảng trên Neon:

```bash
npx prisma migrate dev --name init
```

4. Chạy dev:

```bash
npm run dev
```

Truy cập: http://localhost:3000

- Vào `/register` để tạo tài khoản mới.
- Sau khi đăng ký, hệ thống sẽ tạo sẵn 2 bài viết demo cho user đó.
- Đăng nhập ở `/` rồi sẽ được chuyển tới `/home` với dashboard danh sách bài.

## Deploy lên Vercel

1. Push project này lên GitHub / GitLab / Bitbucket.
2. Tạo project mới trên Vercel, connect tới repo đó.
3. Trong **Project Settings → Environment Variables** thêm:

   - `DATABASE_URL` = chuỗi kết nối Neon của bạn (nhớ `sslmode=require` nếu cần).

4. Build & deploy.

Scripts:

- `npm run build` sẽ tự `prisma generate` rồi `next build`.
- Bạn có thể dùng CI/CD riêng để chạy:

```bash
npx prisma migrate deploy
```

trước khi start app (trên môi trường production).
