Hello

## FE Auth (Quang) — trên nhánh `dev`

Tài liệu đầy đủ: **[FE/README.md](./FE/README.md)**

- Login E2E qua BE API (MongoDB chung — FE chỉ đọc qua API, không đụng DB)
- Session, guards, refresh token, `AuthBootstrap` (`/auth/me`)
- Home UX + student sub-pages (Vũ) trên `dev`

PR target: **`dev`** — không merge thẳng `main`

---

# Deploy Docker (VPS / local production-like)

> **Không có team Docker riêng** — mỗi người tự deploy phần service của mình (BE / FE / AI) theo quy trình chung bên dưới.

Chạy tại **thư mục gốc repo** (có `docker-compose.yml`).

### Trước khi deploy bản mới (bắt buộc)

Tránh conflict container cũ hoặc kẹt cache image khi lên bản mới:

```bash
# 1. Dọn dẹp sạch sẽ các container cũ và mạng ẩn
docker-compose down --remove-orphans

# 2. Xóa cache của image cũ
docker image prune -a -f
```

### Deploy lại stack

```bash
# 3. Build và chạy lại (thêm -d nếu chạy nền trên VPS)
docker-compose up --build
```

| Service | Container | Port | Owner (tham khảo) |
|---------|-----------|------|-------------------|
| `backend` | `ojt_backend` | 3000 | Chinh / BE |
| `frontend` | `ojt_frontend` | 80 | Quang / FE |
| `ai` | `ojt_ai` | 8000 | Team AI |

**Lưu ý:**

- Cấu hình nhạy cảm: `BE/.env` — **không commit** lên Git
- FE build trong Docker dùng `FE/Dockerfile` (Node 20 + Nginx)
- BE build dùng `BE/Dockerfile` (Node 20 Alpine)
- Sau deploy: kiểm tra `http://localhost` (FE), `http://localhost:3000` (BE)

---

# Remember: Standard Workflow tránh bị conflict

## Luôn luôn git pull dev

```bash
# Kéo git pull dev về

git pull dev

# Tạo nhánh mới
git checkout -b feature/....

# Coding...

# Add files
git add .

# Commit
git commit -m "feat: implement login API"

# Push lên nhánh của mình branch
git push origin feature/login

# Sau đó merge vào dev

```

# Git Workflow Guidelines

## 1. Không code trực tiếp trên `main`.

### Branch Structure

```bash
main
develop
feature/login
feature/user-management
bugfix/login-error
```

### Tạo branch mới

```bash
git checkout -b feature/login
```

---

## 2. Hoàn thành 1 chức năng nhớ commit

### ✅ Good Examples

```bash
git commit -m "feat: implement login API"
```

```bash
git commit -m "fix: resolve JWT validation issue"
```

---

## 3. Verify Code Before Commit

### Backend

```bash
npm run dev
```

### Frontend

```bash
npm run ...
```

---

## \*\*\* Để Commit trên git

### 1. Thêm tất cả file

```bash
git add .
```

## 2. Commit Message

```bash
git commit -m "feat: implement login API"
```

##### Feature:

```bash
feat: add user registration API
```

### Bug Fix

```bash
fix: correct password validation
```

---

## 6. Pull Before Push

Luôn đồng bộ code mới nhất trước khi push.

### Develop Branch

```bash
git pull origin develop
```

Điều này giúp hạn chế conflict khi merge.

---

## 7. Push to lên nhánh của mình

```bash
git push origin feature/login
```

### Important

- Nhớ tạo nhánh riêng
- Không push trực tiếp lên và không merge vào `main`
- Không push trực tiếp lên `develop`
- Nhớ merge vào `dev`

---
