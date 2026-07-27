# OJT KNS SU26 — Frontend

Hệ thống hỗ trợ học tập AI cho Aviation Academy.

| | |
|---|---|
| **Nhánh làm việc** | `dev` (auth đã merge; có thể tách `feature/duy-quang` khi cần) |
| **Requirement** | SE-F1 (Auth) + **FE platform** (router, layout, kết nối 3 actor) |
| **Owner** | **Quang** — auth, session, guards, layout, route/nav config, API client |
| **PR target** | `dev` (không merge thẳng `main`) |
| **Liên hệ BE** | **Chinh** — Auth API |

> Đọc file này để chạy FE, hiểu auth flow và tiếp tục code trên `dev`.

---

## Mục tiêu nhánh này

**Quang** dựng khung FE (auth, router, layout, nav, prefetch).

**Cấm đụng:** `BE/**` · `features/student/**` · `features/dashboard/**` (teacher + admin).

| AE | Role | Folder | Quy tắc |
|----|------|--------|---------|
| **Vũ** | Student | `src/features/student/` | Chỉ Vũ sửa |
| **Long** | Teacher | `src/features/dashboard/` | Chỉ Long sửa |
| **Quốc Anh** | Admin | `src/features/dashboard/` | Chỉ Quốc Anh sửa |

**Quang** chỉ wire ở `src/features/auth/config/` (route + nav) — **không mở file** trong 3 folder actor trên.

**Quy tắc sản phẩm:**

- Không có **Register** public — tài khoản do Admin cấp
- Login full-page tại `/login` (tách khỏi `MainLayout`)
- Login: email + password (role lấy từ BE sau khi đăng nhập)
- Logo máy bay trên login → click về Home (`/`)
- UI: shadcn/ui + theme aviation

---

## Quick start

```bash
git fetch origin
git checkout dev
git pull origin dev

cd FE
cp .env.example .env   # VITE_API_URL=/api
npm install
npm run dev
```

**BE (Chinh)** — chạy song song port 3000. FE **không** kết nối MongoDB trực tiếp; chỉ gọi API auth. DB chung do Chinh quản lý — thiếu user thì nhờ Chinh, không seed/register từ FE.

```bash
cd BE
cp .env.example .env   # thêm MONGODB_URI từ team (local only, không commit)
npm install
npm run dev
```

| | URL |
|---|---|
| FE | http://localhost:5173 |
| BE (proxy dev) | `/api` → `http://localhost:3000` |

```bash
npx vite build  # production build (khuyến nghị)
npm run lint    # ESLint
npm run preview # preview build
```

**Tài khoản test (MongoDB team — Atlas chung):**

| Role | Email | Password | Ghi chú |
|------|-------|----------|---------|
| STUDENT | `student@academy.edu` | `123456` | Account seed team |
| STUDENT | `quang27110910@gmail.com` | `123456` | Account cá nhân |
| TEACHER | `quangdnis@gmail.com` | `123456` | Teacher trên DB chung |
| TEACHER | `teacher@academy.edu` | — | Chưa có trên DB — nhờ Chinh seed |
| ADMIN | `admin@academy.edu` | — | Chưa có trên DB — nhờ Chinh seed |

Đăng nhập FE: nhập email + password — BE trả `user.role`, FE redirect theo role.

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
- [x] Login end-to-end với BE (MongoDB chung + JWT)
- [x] Refresh token — `POST /api/auth/refresh-token`
- [x] Session reload — `AuthBootstrap` + `GET /api/auth/me`
- [x] Home UX khi đã login (ẩn Sign in, link feature cards)
- [x] Form validation nâng cao — `utils/rules.ts`, RHF `onTouched`
- [x] Dynamic routing theo role — `features/auth/config/roleRoutes.ts`
- [x] Lazy loading — `lib/lazyRoute.ts`, login/home lazy chunks
- [x] Security scaffold — `auth/security/` (2FA UI, audit table, login alerts) — `bf5d27d`
- [x] Role nav + perf — `roleNav.ts`, eager prefetch, `RoutePendingBar`, `PageSkeleton` — `a86b4af`
- [x] Student sub-pages (Vũ) — wired in `roleRoutes.ts`, không sửa `student/`
- [ ] Teacher / Admin dashboard content — Long, Quốc Anh (`features/dashboard/`)

---

## Routes

| Path | Access | Ghi chú |
|------|--------|---------|
| `/` | Public | Home (`MainLayout`) |
| `/login` | Guest only | Full-page login, không header |
| `/student` | `STUDENT` | Vũ — home |
| `/student/ask-ai` | `STUDENT` | Vũ |
| `/student/ask-ai/:subjectId` | `STUDENT` | Vũ — AI chat |
| `/student/history` | `STUDENT` | Vũ |
| `/student/quiz` | `STUDENT` | Vũ |
| `/student/quiz/:quizId` | `STUDENT` | Vũ |
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

    User->>LoginForm: Email + password
    LoginForm->>useLoginMutation: submit (RHF + Zod)
    useLoginMutation->>authService: POST /auth/login
    authService->>BE: { email, password }
    BE-->>authService: { accessToken, refreshToken, user }
    useLoginMutation->>Zustand: setAuth(tokens, user)
    useLoginMutation->>Router: navigate theo role
```

**Auth flow tóm tắt:**

1. `LoginForm` → `useLoginMutation` → `authService.login`
2. BE trả `user.role` → redirect theo role (Student / Teacher / Admin)
3. Tokens + user → Zustand persist key `ojt-kns-auth` (localStorage)
4. `apiClient` gắn `Authorization: Bearer` + `withCredentials` (refresh cookie)
5. 401 (trừ `/login`, `/logout`, `/refresh-token`) → refresh → fail → redirect `/login`
6. Reload app → `AuthBootstrap` gọi `/auth/me` → cập nhật user hoặc clear session
7. Logout → clear store + React Query cache

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
│   ├── auth/               # Quang — login, session, security scaffold
│   │   └── config/         # roleRoutes.ts, roleNav.ts, buildProtectedRoutes
│   ├── landing/            # HomePage
│   ├── student/            # Vũ — student pages
│   └── dashboard/          # placeholder — Long, Quốc Anh
├── shared/
│   ├── components/
│   │   ├── ui/             # shadcn/ui primitives
│   │   └── common/         # guards, error boundary, loading states
│   ├── layouts/            # MainLayout
│   ├── constants/          # API_ENDPOINTS, QUERY_KEYS
│   └── types/
├── lib/                    # axios, queryClient, lazyRoute, utils
├── utils/                  # rules.ts — Zod validation rules dùng chung
└── styles/                 # globals.css
```

### Auth feature (`features/auth/`)

| File | Mô tả |
|------|--------|
| `types.ts` | `UserRole`, `LoginRequest`, `ROLE_HOME_PATH` |
| `schema.ts` | Zod `loginSchema` |
| `store.ts` | Zustand persist `ojt-kns-auth` |
| `services.ts` | `authService.login` / `logout` / `getMe` — normalize response BE |
| `utils/tokenResponse.ts` | `extractTokenPair` — `accessToken` / legacy `token` |
| `components/AuthBootstrap.tsx` | Gọi `/auth/me` khi reload (non-blocking) |
| `config/roleRoutes.ts` | Đăng ký route lazy theo role |
| `config/roleNav.ts` | Menu header theo role |
| `utils/prefetchRoutes.ts` | Prefetch chunk (eager sau login) |
| `security/` | Audit log + 2FA scaffold (chờ BE) |
| `hooks/useAuth.ts` | `useLoginMutation`, `useLogoutMutation` |
| `components/LoginForm.tsx` | Form đăng nhập (email + password) |
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

## API contract (BE — Chinh)

Base: `/api/auth`

### `POST /api/auth/login`

**Request (BE đọc):**

```json
{
  "email": "student@academy.edu",
  "password": "string"
}
```

FE form còn gửi `role` để **validate client-side** sau khi nhận `user.role`.

**Response** (FE normalize tại `features/auth/services.ts`):

```json
{
  "message": "Login successful",
  "accessToken": "jwt...",
  "refreshToken": "jwt...",
  "token": "jwt...",
  "user": {
    "id": "...",
    "fullName": "...",
    "email": "student@academy.edu",
    "role": "STUDENT",
    "status": "ACTIVE"
  }
}
```

FE ưu tiên `accessToken`; chấp nhận legacy field `token` và wrapper `result` / `data`.

### `POST /api/auth/logout` — Bearer required

### `POST /api/auth/refresh-token` — body `{ refreshToken }` hoặc httpOnly cookie

### `GET /api/auth/me` — Bearer required

FE gọi khi reload app (`AuthBootstrap`) để xác thực session còn hợp lệ.

---

## Thêm route / page mới (phối hợp team)

**Owner page** (Vũ / Long / Quốc Anh):

1. Tạo page trong `features/student/` hoặc `features/dashboard/`
2. Export từ `index.ts` của feature đó

**Quang** (chỉ wire — không sửa file trong folder actor):

1. Thêm entry trong `features/auth/config/roleRoutes.ts`
2. Thêm menu (nếu cần) trong `features/auth/config/roleNav.ts`
3. Commit + push scope Quang

**Lưu ý:** API data dùng React Query — không duplicate vào Zustand.

---

## Git (Quang)

- Nhánh: `dev`
- **Làm tới đâu → commit + push tới đó**
- Commit: `git commit-tree` — không `Co-authored-by: Cursor`
- Trước push: `git diff --cached --name-only` — không có `BE/`, `student/`, `dashboard/`, `LOCAL-QUANG/`, `env.txt`

**Được push:** `features/auth/**`, `app/`, `landing/`, `shared/`, `lib/axios.ts`, `FE/README.md`

```bash
git checkout dev
git pull origin dev
# ... code scope Quang ...
git push origin dev
```

**Commit gần nhất (auth/platform):**

- `a86b4af` — roleNav, eager prefetch, nav perf
- `bf5d27d` — security scaffold
- `9ebfbf3` — session perf + prefetch
- `4b6d6d5` — validation + dynamic routing + lazy loading

---

## Deploy

`vercel.json` có sẵn cho SPA routing. Set `VITE_API_URL` trên Vercel khi deploy.
