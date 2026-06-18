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

## Folder structure (for teammates)

```
src/
├── components/
│   ├── guards/          # RequireAuth, GuestGuard, RoleGuard
│   ├── layouts/         # MainLayout (header, nav, logout)
│   ├── ui/              # Shared UI primitives
│   └── errors/          # Error boundaries
├── features/
│   ├── auth/            # LoginForm, LoginPage (Quang)
│   ├── student/         # Student screens (Vũ)
│   └── dashboard/       # Teacher & Admin (Long, Anh)
├── hooks/               # useLoginMutation, useLogoutMutation
├── lib/
│   ├── api/             # Service layer — normalize BE responses here
│   └── http/            # axios apiClient + interceptors
├── pages/               # Public pages (HomePage)
├── stores/              # Zustand (auth.store)
├── types/               # Shared TypeScript types
├── utils/               # Zod schemas (rules.ts)
└── router.tsx           # All routes — add new routes here
```

## Routes

| Path | Access | Owner |
|------|--------|-------|
| `/` | Public | — |
| `/login` | Guest only | Quang |
| `/student` | STUDENT | Vũ |
| `/teacher/dashboard` | TEACHER | Long |
| `/admin/dashboard` | ADMIN | Anh |

After login, users redirect by `user.role`. No public registration (accounts provisioned by Admin).

## How to add a new feature page

1. Create page under `src/features/<module>/pages/YourPage.tsx`
2. Add API in `src/lib/api/<module>.api.ts` (normalize BE response)
3. Add custom hook in `src/hooks/` if using React Query
4. Register route in `router.tsx` with correct `RoleGuard`
5. Add nav link in `MainLayout.tsx` if needed

## API contract (for BE — Chinh)

FE expects these endpoints. **Do not change FE to match ad-hoc BE shapes** — BE should align or service layer normalizes.

### POST `/api/auth/login`

**Request (camelCase JSON):**
```json
{
  "email": "student@academy.edu",
  "password": "string"
}
```

**Response (any of these shapes are normalized in `auth.api.ts`):**
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

`role` must be one of: `STUDENT` | `TEACHER` | `ADMIN`

### POST `/api/auth/logout`

Clears server session (optional for client; FE clears store + query cache regardless).

### POST `/api/auth/refresh` (optional, for token refresh)

**Request:** `{ "refreshToken": "..." }`  
**Response:** `{ "accessToken": "...", "refreshToken": "..." }`

## Auth flow

1. `LoginForm` → `useLoginMutation` → `authApi.login`
2. Tokens + user saved in Zustand (`ojt-kns-auth` in localStorage)
3. `apiClient` attaches `Authorization: Bearer <token>`
4. 401 → refresh attempt → fail → redirect `/login`
5. Logout → `authApi.logout` → clear store → `queryClient.removeQueries()`

## Git branch (Quang)

```bash
git checkout dev
git pull origin dev
git checkout -b feature/se-f1-auth-login
# after changes
git commit -m "[SE-F1.1] feat: implement login form and auth guards"
git push origin feature/se-f1-auth-login
```

## Deploy

`vercel.json` included for SPA deep-link routing. Set `VITE_API_URL` in Vercel environment variables.
