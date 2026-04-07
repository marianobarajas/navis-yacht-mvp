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

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- Prisma ORM, PostgreSQL (Supabase)
- Supabase Storage (task/comment attachments)
- NextAuth with Credentials provider, bcryptjs
- Server Actions for writes, RBAC enforced server-side, middleware route protection
