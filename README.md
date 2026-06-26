Hello

## FE Auth (Quang) — trên nhánh `dev`

Tài liệu đầy đủ: **[FE/README.md](./FE/README.md)**

- Login E2E với BE (MongoDB + JWT)
- Session, guards, refresh token
- Student sub-pages (Vũ) đã có trên `dev`
- API contract + hướng dẫn chạy local

PR target: **`dev`** — không merge thẳng `main`

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
