# The Pixel Dream

This repo currently has:

- `web/`: Next.js app (deploy to Vercel using **Root Directory = `web`**)
- `legacy/`: the old static `index.html` kept for reference

## Local dev

```bash
cd web
npm install
npm run dev
```

## Supabase setup

1. Create a Supabase project.
2. Run `web/supabase/schema.sql` in the Supabase SQL editor.
3. Create `web/.env.local` based on `web/.env.local.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server/webhooks only)

## Admin access

- Create a user via `/signup`
- In Supabase, set `profiles.role = 'admin'` for your user id
- Open `/admin` to create products

## Payments

### Stripe

Set:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Webhook route:
- `POST /api/webhooks/stripe`

### Coinbase Commerce

Set:
- `COINBASE_COMMERCE_API_KEY`
- `COINBASE_COMMERCE_WEBHOOK_SECRET`

Webhook route:
- `POST /api/webhooks/coinbase`

## Affiliate attribution (MVP)

Referral code is captured at **signup** (field `Código de indicação`) and stored immutably in `profiles.referred_by_code`.
On successful payments (Stripe/Coinbase webhooks), a commission record is created if the code belongs to an **active** affiliate.

