# OceanOps Yacht MVP

Next.js 14+ (App Router) TypeScript skeleton with Prisma, NextAuth (Credentials), RBAC, and Supabase PostgreSQL.

## Commands

```bash
npm install
```

Copy `.env.example` to `.env` and set:

- `DATABASE_URL` — Supabase Postgres connection string (transaction pooler)
- `DIRECT_URL` — Supabase direct connection (for migrations)
- `NEXTAUTH_URL` — e.g. `http://localhost:3000`
- `NEXTAUTH_SECRET` — random secret for session signing
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (e.g. `https://xxx.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (for storage uploads)

Then:

```bash
npx prisma migrate dev
# or for production: npx prisma migrate deploy
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to `/login` when not authenticated.

## Add a new customer (organization)

Each customer is a separate **organization** in the database (their users and yachts stay isolated). To onboard a new tenant and create their first **ADMIN** (same DB as the app — check `.env`):

```bash
npm run provision-org
```

Follow the prompts (company name, admin email, name, password). Optional: set `ADMIN_PASSWORD` in the environment so the script only asks for non-secret fields.

For automation or CI, you can pass everything via env:

```bash
ORG_NAME="Blue Fleet Ltd" ADMIN_EMAIL="owner@example.com" ADMIN_NAME="Sam Owner" ADMIN_PASSWORD="secure-pass-here" npm run provision-org
```

Admin emails must be **unique in the database** (one account per email today). The new admin signs in at `/login`, then adds yachts and invites crew inside the app.

## Platform console (software owner)

After `npm run seed`, a **platform** account exists (no tenant — sees every organization and tenant user, and can add new orgs from the UI):

| Account        | Password |
|----------------|----------|
| `admin@admin`  | `Navis`  |

Sign in at `/signin`, then open **`/platform`**. Normal fleet pages redirect platform users to `/platform`; tenant users cannot access `/platform`.

**Production:** change this password (or remove the user) and treat `isPlatformAdmin` as highly sensitive — it is not exposed in the app’s user admin UI.

## Seeded credentials

| Role        | Email                 | Password   |
|------------|------------------------|------------|
| Admin      | admin@oceanops.demo    | admin123   |
| Manager    | manager@oceanops.demo  | manager123 |
| Technician | tech1@oceanops.demo   | tech123    |
| Technician | tech2@oceanops.demo    | tech123    |

## Routes

- **Public:** `/login`
- **Protected:** `/dashboard`, `/crew`, `/documents`, `/maintenance`, `/maintenance/yachts`, `/maintenance/yachts/[id]`, `/tasks`, `/tasks/[id]`, `/logs`, `/calendar`
- **Admin (ADMIN or MANAGER):** `/admin/users`
- **Platform only (`isPlatformAdmin`):** `/platform` (all tenants; add organizations)

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- Prisma ORM, PostgreSQL (Supabase)
- Supabase Storage (task/comment attachments)
- NextAuth with Credentials provider, bcryptjs
- Server Actions for writes, RBAC enforced server-side, middleware route protection
