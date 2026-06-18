# OJT KNS SU26 — Frontend

Hệ thống hỗ trợ học tập AI cho Aviation Academy.

| | |
|---|---|
| **Nhánh** | `feature/duy-quang` |
| **Requirement** | SE-F1 — Authentication & Authorization |
| **Owner** | **Quang** — login, session, guards, layout, API client |
| **PR target** | `dev` (không merge thẳng `main`) |
| **Liên hệ BE** | **Chinh** — Auth API |

> Ai checkout nhánh `feature/duy-quang` chỉ cần đọc file này là đủ context để chạy FE và tiếp tục code.

---

## Mục tiêu nhánh này

Nền tảng Frontend cho đăng nhập và phân quyền. Các AE tiếp tục build feature trên scaffold này:

| AE | Role | Route sau login | Folder làm việc |
|----|------|-----------------|-----------------|
| **Vũ** | Student | `/student` | `src/features/student/` |
| **Long** | Teacher | `/teacher/dashboard` | `src/features/dashboard/` |
| **Quốc Anh** | Admin | `/admin/dashboard` | `src/features/dashboard/` |

**Quy tắc sản phẩm:**

- Không có **Register** public — tài khoản do Admin cấp
- Login full-page tại `/login` (tách khỏi `MainLayout`)
- Login: chọn role (Student / Teacher / Admin) + email + password
- Logo máy bay trên login → click về Home (`/`)
- UI: shadcn/ui + theme aviation

---

## Quick start

```bash
git fetch origin
git checkout feature/duy-quang

cd FE
cp .env.example .env
npm install
npm run dev
```

| | URL |
|---|---|
| FE | http://localhost:5173 |
| BE (proxy dev) | `/api` → `http://localhost:3000` |

```bash
npm run build   # typecheck + production build
npm run lint    # ESLint
npm run preview # preview build
```

---

## Environment

| Variable | Default | Mô tả |
|----------|---------|-------|
| `VITE_API_URL` | `/api` | API base URL. Dev: Vite proxy sang BE port 3000 |

---

## Trạng thái

- [x] Auth scaffold + guards + router
- [x] shadcn/ui login + home
- [x] Role picker (3 roles: Student / Teacher / Admin)
- [x] Cấu trúc thư mục theo [main-course-project](https://github.com/kat-minh/main-course-project)
- [ ] Login end-to-end — **chờ BE Chinh** implement API
- [ ] Student / Teacher / Admin features — ae owner tự làm tiếp

---

## Routes

| Path | Access | Ghi chú |
|------|--------|---------|
| `/` | Public | Home (`MainLayout`) |
| `/login` | Guest only | Full-page login, không header |
| `/student` | `STUDENT` | Vũ |
| `/teacher/dashboard` | `TEACHER` | Long |
| `/admin/dashboard` | `ADMIN` | Quốc Anh |

Sau login redirect theo `user.role`:

| Role | Redirect |
|------|----------|
| `STUDENT` | `/student` |
| `TEACHER` | `/teacher/dashboard` |
| `ADMIN` | `/admin/dashboard` |

---

## Luồng đăng nhập

```mermaid
sequenceDiagram
    participant User
    participant LoginForm
    participant useLoginMutation
    participant authService
    participant BE as BE /api/auth/login
    participant Zustand as auth.store
    participant Router

    User->>LoginForm: Chọn role + email + password
    LoginForm->>useLoginMutation: submit (RHF + Zod)
    useLoginMutation->>authService: POST /auth/login
    authService->>BE: { email, password, role }
    BE-->>authService: { accessToken, refreshToken, user }
    useLoginMutation->>useLoginMutation: role FE === user.role?
    useLoginMutation->>Zustand: setAuth(tokens, user)
    useLoginMutation->>Router: navigate theo role
```

**Auth flow tóm tắt:**

1. `LoginForm` → `useLoginMutation` → `authService.login`
2. Validate role FE chọn khớp `user.role` từ BE (không khớp → toast lỗi)
3. Tokens + user → Zustand persist key `ojt-kns-auth` (localStorage)
4. `apiClient` gắn `Authorization: Bearer`
5. 401 → thử refresh → fail → redirect `/login`
6. Logout → clear store + React Query cache

---

## Route guards

```mermaid
flowchart LR
    subgraph Public
        Home["/"]
        Login["/login"]
    end

    Login --> GuestGuard
    Home --> MainLayout
    MainLayout --> RequireAuth
    RequireAuth --> RoleGuard
```

| Guard | File | Hành vi |
|-------|------|---------|
| `GuestGuard` | `shared/components/common/GuestGuard.tsx` | Đã login → redirect home theo role |
| `RequireAuth` | `shared/components/common/RequireAuth.tsx` | Chưa login → `/login`, lưu `from` |
| `RoleGuard` | `shared/components/common/RoleGuard.tsx` | Sai role → redirect home đúng role |

---

## Cấu trúc thư mục

```
src/
├── app/                    # App root, router, providers
│   ├── App.tsx
│   ├── router.tsx
│   └── providers/
├── features/               # Business modules
│   ├── auth/               # types, schema, store, services, hooks, components, pages
│   ├── landing/            # HomePage
│   ├── student/            # placeholder — Vũ
│   └── dashboard/          # placeholder — Long, Quốc Anh
├── shared/
│   ├── components/
│   │   ├── ui/             # shadcn/ui primitives
│   │   └── common/         # guards, error boundary, loading states
│   ├── layouts/            # MainLayout
│   ├── constants/          # API_ENDPOINTS, QUERY_KEYS
│   └── types/
├── lib/                    # axios, queryClient, utils
└── styles/                 # globals.css
```

### Auth feature (`features/auth/`)

| File | Mô tả |
|------|--------|
| `types.ts` | `UserRole`, `LoginRequest`, `ROLE_HOME_PATH` |
| `schema.ts` | Zod `loginSchema` |
| `store.ts` | Zustand persist `ojt-kns-auth` |
| `services.ts` | `authService.login` / `logout` — normalize response BE |
| `hooks/useAuth.ts` | `useLoginMutation`, `useLogoutMutation` |
| `components/LoginForm.tsx` | Form + role picker |
| `components/RoleSelector.tsx` | Chọn Student / Teacher / Admin |
| `pages/LoginPage.tsx` | Wrapper trang login |

---

## Stack

| Công nghệ | Dùng cho |
|-----------|----------|
| React 18 + TypeScript + Vite | Scaffold |
| React Router v6 | Routing, lazy load |
| Zustand + persist | Auth state |
| TanStack Query | Login / logout mutations |
| Axios (`lib/axios.ts`) | HTTP + interceptors |
| React Hook Form + Zod | Validation form login |
| shadcn/ui + Tailwind | UI components |
| Sonner | Toast notifications |
| Lucide | Icons |

---

## API contract (cho BE — Chinh)

### `POST /api/auth/login`

**Request:**

```json
{
  "email": "student@academy.edu",
  "password": "string",
  "role": "STUDENT"
}
```

`role`: `STUDENT` | `TEACHER` | `ADMIN`

**Response** (FE normalize tại `features/auth/services.ts`):

```json
{
  "accessToken": "jwt...",
  "refreshToken": "jwt...",
  "user": {
    "id": "1",
    "fullName": "Nguyen Van A",
    "email": "student@academy.edu",
    "role": "STUDENT"
  }
}
```

FE cũng chấp nhận wrapper `result` và field `snake_case` từ BE.

### `POST /api/auth/logout` — optional

### `POST /api/auth/refresh` — optional (401 → auto refresh)

---

## Thêm feature mới

1. Page: `src/features/<module>/pages/YourPage.tsx`
2. Service: `src/features/<module>/services.ts` — normalize response BE tại đây
3. Hook (nếu cần): `src/features/<module>/hooks/useXxx.ts`
4. Barrel export: `src/features/<module>/index.ts`
5. Route: `src/app/router.tsx` + bọc `RoleGuard` đúng role
6. Nav (nếu cần): `src/shared/layouts/MainLayout.tsx`

**Lưu ý:** Không duplicate server data vào Zustand — dùng React Query cho API data.

---

## Git

```bash
# Làm việc trên nhánh auth
git checkout feature/duy-quang
git pull origin feature/duy-quang

# Trước khi mở PR — sync dev
git checkout dev
git pull origin dev
git checkout feature/duy-quang
git merge dev   # hoặc rebase dev (theo convention team)

git push origin feature/duy-quang
```

**Commit format:** `[SE-Fx.x] feat|fix|refactor: mô tả`

**Commits chính trên nhánh:**

- `[SE-F1.1] feat: implement login form and auth guards`
- `[SE-F1.1] refactor: align FE structure with main-course-project pattern`
- `[SE-F1.1] fix: use plane logo as back-to-home link on login`
- `[SE-F1.1] docs: update README and TEAM-HANDOFF for current FE structure`

---

## Deploy

`vercel.json` có sẵn cho SPA routing. Set `VITE_API_URL` trên Vercel khi deploy.
