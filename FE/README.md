# OJT KNS SU26 — Frontend

AI learning support system for Aviation Academy.

**Owner (auth base):** Quang — login, session, guards, layout, API client.

## Quick start

```bash
cd FE
cp .env.example .env
npm install
npm run dev
```

App: http://localhost:5173

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (port 5173) |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api` | API base URL (Vite proxies to BE port 3000 in dev) |

## Folder structure

Theo pattern [main-course-project](https://github.com/kat-minh/main-course-project):

```
src/
├── app/                    # App root, router, providers
│   ├── App.tsx
│   ├── router.tsx
│   └── providers/
├── features/               # Business modules
│   ├── auth/               # types, schema, store, services, hooks, components, pages
│   ├── landing/            # HomePage
│   ├── student/
│   └── dashboard/
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

## Routes

| Path | Access | Notes |
|------|--------|-------|
| `/` | Public | Home (MainLayout) |
| `/login` | Guest only | Full-page login, không có header |
| `/student` | STUDENT | Vũ |
| `/teacher/dashboard` | TEACHER | Long |
| `/admin/dashboard` | ADMIN | Anh |

- Sau login redirect theo `user.role`
- Không có đăng ký public (admin provision)
- Login: chọn role (Student / Teacher / Admin) + email/password
- Logo máy bay trên login → click về Home

## How to add a new feature

1. Page: `src/features/<module>/pages/YourPage.tsx`
2. Service: `src/features/<module>/services.ts` — normalize BE response tại đây
3. Hook (nếu cần): `src/features/<module>/hooks/useXxx.ts`
4. Barrel: `src/features/<module>/index.ts`
5. Route: `src/app/router.tsx` + `RoleGuard` đúng role
6. Nav (nếu cần): `src/shared/layouts/MainLayout.tsx`

## API contract (for BE — Chinh)

### POST `/api/auth/login`

**Request:**
```json
{
  "email": "student@academy.edu",
  "password": "string",
  "role": "STUDENT"
}
```

`role`: `STUDENT` | `TEACHER` | `ADMIN`

**Response** (normalized in `features/auth/services.ts`):
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

FE cũng chấp nhận `result` / `snake_case` từ BE.

### POST `/api/auth/logout` — optional

### POST `/api/auth/refresh` — optional (401 auto-refresh)

## Auth flow

1. `LoginForm` → `useLoginMutation` → `authService.login`
2. Validate role FE chọn khớp `user.role` từ BE
3. Tokens + user → Zustand (`ojt-kns-auth`, localStorage)
4. `apiClient` gắn `Authorization: Bearer`
5. 401 → refresh → fail → `/login`
6. Logout → clear store + React Query cache

## Git

```bash
git checkout dev
git pull origin dev
git checkout feature/duy-quang
git push origin feature/duy-quang
```

PR target: **`dev`** (không merge thẳng `main`).

## Deploy

`vercel.json` included for SPA routing. Set `VITE_API_URL` on Vercel.
