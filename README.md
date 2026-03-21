# IntelliDocs Demo

A document-aware chat application built with Next.js, Supabase Auth, Postgres, and Drizzle ORM.

## Features

- Email/password authentication via Supabase
- User-scoped conversations, message history, and stats
- TXT/PDF upload with extracted text stored for chat context
- Gemini integration with safe demo fallback mode
- Drizzle migrations and SQL repair scripts for schema drift

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Supabase Auth
- Postgres + Drizzle ORM
- Tailwind CSS

## Prerequisites

- Node.js `>= 20.9.0`
- A Supabase project
- Environment variables in `.env`

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `DIRECT_URL` (recommended for migrations)
- `GEMINI_API_KEY` (optional; app works in demo fallback mode without it)

## Local Development

1. Install dependencies
   - `npm install`
2. Run migrations
   - `npm run db:migrate`
3. Start dev server
   - `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000)

## Production Validation

Run this before deploying:

1. `npm run lint`
2. `npm run build`
3. `npm run start`

If `next start` says no production build exists, run `npm run build` first.

## User Isolation Test

Automated data-isolation validation (User A vs User B):

1. Set test user env vars in your shell:
   - `TEST_USER_A_EMAIL`
   - `TEST_USER_A_PASSWORD`
   - `TEST_USER_B_EMAIL`
   - `TEST_USER_B_PASSWORD`
2. Ensure app is running locally at `http://localhost:3000`
3. Run:
   - `npm run test:isolation`

Pass criteria:

- Script ends with `Isolation test completed successfully.`
- No `FAIL:` lines are printed

## Deployment Notes

- Do not commit `.env` files
- Ensure production environment variables are set in your hosting provider
- Keep DB schema aligned with `src/db/schema.ts` and Drizzle migrations

## Scripts

- `npm run dev` - start development server
- `npm run build` - create production build
- `npm run start` - run production server
- `npm run lint` - run ESLint
- `npm run db:generate` - generate Drizzle migration
- `npm run db:migrate` - preflight check + apply migrations
- `npm run test:isolation` - run two-user data isolation checks
