# AI Cover Letter Generator — SaaS (Next.js 14 + Supabase + Paddle + OpenAI)

A premium, conversion-focused application that generates ATS-optimized cover letters from a job post + resume in under 60 seconds.

## Tech Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn-style UI
- Supabase (DB + Auth)
- Paddle (using Pay Links for fast go-live; upgradeable to Billing API)
- OpenAI GPT-4 family for generation
- PostHog analytics
- Vercel hosting

## Quick Start

1. **Clone & Install**
```bash
pnpm i   # or npm i / yarn
cp .env.example .env.local
```

2. **Create Supabase project** and fill `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE`.
   - Run SQL from `supabase/migrations/000_init.sql` in Supabase SQL editor.

3. **Configure Auth**
   - In Supabase **Authentication → URL Config**, set site URL to your domain (or `http://localhost:3000`).
   - Enable Email (magic link) and optionally Google OAuth.

4. **Paddle**
   - Create two **Pay Links** (Pro monthly, Premium monthly). Paste URLs into `NEXT_PUBLIC_PADDLE_LINK_PRO` and `NEXT_PUBLIC_PADDLE_LINK_PREMIUM`.
   - Set **Return URL** to your site `/dashboard`.
   - Add a **Webhook** pointing to `/api/paddle/webhook` and set `PADDLE_WEBHOOK_SECRET`.

5. **OpenAI**
   - Set `OPENAI_API_KEY`. Default model is `gpt-4o-mini`.

6. **Run Dev**
```bash
pnpm dev
```

7. **Deploy to Vercel**
   - Import the repo, set Environment Variables, target Node 18+, and deploy.

## Database Schema
See `supabase/migrations/000_init.sql` for tables, indexes, RLS policies.

## API Endpoints
- `POST /api/generate` — Generate a cover letter; enforces usage limits.
- `GET /api/usage` — Returns usage meter for the current month.
- `POST /api/paddle/webhook` — Paddle webhook receiver (Pay Links / Billing).

## Key UI Pages
- `/` Landing page (SEO-optimized, pricing, CTA)
- `/login` Auth
- `/dashboard` Saved letters, usage
- `/generator` Create new letter
- `/billing` Upgrade/Manage plan

## SEO
- Custom metadata in `src/app/layout.tsx`
- `app/robots.txt` + `app/sitemap.xml` routes
- JSON-LD on homepage

## Notes on Paddle
This starter uses **Pay Links** to go live immediately. You can later migrate to Paddle Billing API and programmatic checkouts; the webhook handler is designed to be adaptable—update the event parsing as needed.

## PostHog
Set `NEXT_PUBLIC_POSTHOG_KEY`. Session replay and events are initialized in `src/lib/analytics.ts`.

## PDF Export
`/api/export-pdf` converts generated text to a simple, clean A4 PDF and returns a file download.

---

**Security**
- RLS policies only allow users to read/write their own records.
- Webhooks verify secret header.
- Server route checks auth via Supabase cookies.

**Performance**
- Edge-friendly routes, streaming generation optional.
- Minimal CSS; Tailwind & small UI kit.
