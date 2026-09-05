# CozyCraft — Backend Setup Guide

## Prerequisites
- [Supabase](https://supabase.com) project (free tier works)
- [Razorpay](https://razorpay.com) account (test mode for development)
- [Shiprocket](https://app.shiprocket.in) account
- [Resend](https://resend.com) account with a verified sending domain

---

## 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role secret |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay → Settings → API Keys → Key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay → Settings → API Keys → Key Secret |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay → Webhooks → create one → copy secret |
| `SHIPROCKET_EMAIL` | Your Shiprocket login email |
| `SHIPROCKET_PASSWORD` | Your Shiprocket login password |
| `SHIPROCKET_WEBHOOK_SECRET` | Shiprocket → Settings → API → Shipment Webhook Settings |
| `RESEND_API_KEY` | Resend → API Keys → create one |
| `RESEND_FROM_EMAIL` | e.g. `orders@yourdomain.com` (must be verified in Resend) |
| `CRON_SECRET` | Any random string — used to auth `/api/cron/*` routes |

> **Never commit `.env.local` to git.** It is already covered by `.gitignore` via `.env*`.

---

## 2. Run the Database Migrations

Run these **in order** in Supabase → **SQL Editor**:

1. [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) — core schema, enums, tables
2. [`supabase/migrations/0002_shipping_and_history.sql`](./supabase/migrations/0002_shipping_and_history.sql) — shipping status, audit log, email log, idempotency ledger
3. [`supabase/seed.sql`](./supabase/seed.sql) — 4 demo products (optional)

> If running against a database that **already has 0001 data**, read the comment at the top of `0002` — it automatically remaps any rows with old shipping-only order statuses before rebuilding the enum.

---

## 3. Create the First Admin User

### Step 1 — Create a user in Supabase Auth

1. Supabase → **Authentication** → **Users** → **Add user**
2. Enter the admin email and a strong password
3. Note the user's **UID**

### Step 2 — Insert the admin profile

```sql
insert into profiles (id, role)
values ('<paste-user-uid-here>', 'admin');
```

### Step 3 — Sign in

Navigate to `/admin/login` and sign in with your admin email and password.

---

## 4. Register the Razorpay Webhook

1. Razorpay → **Settings** → **Webhooks** → **Add New Webhook**
2. URL: `https://yourdomain.com/api/webhooks/razorpay`
3. Events: ✅ `payment.captured`, ✅ `payment.failed`
4. Copy the webhook secret → add to `.env.local` as `RAZORPAY_WEBHOOK_SECRET`

> For local testing: use [ngrok](https://ngrok.com) and Razorpay test mode.

---

## 5. Configure Shiprocket

### API credentials

Set `SHIPROCKET_EMAIL` and `SHIPROCKET_PASSWORD` in `.env.local`. These are your Shiprocket account login credentials. The app exchanges them for a JWT token on first use and caches it for 220 hours.

### Pickup location

The app creates shipments with `pickup_location: "Primary"`. You **must** create a pickup address in:

Shiprocket → **Settings** → **Pickup Addresses**

Name it exactly **`Primary`** (case-sensitive), or update `lib/shiprocket/client.ts` line ~95 to match your name.

### Shiprocket webhook

1. Shiprocket → **Settings** → **API** → **Shipment Webhook Settings**
2. URL: `https://yourdomain.com/api/webhooks/shiprocket`
3. Copy the webhook token → add to `.env.local` as `SHIPROCKET_WEBHOOK_SECRET`

> ⚠️ Shiprocket's webhook authentication format isn't fully documented publicly. The handler checks both the `x-api-key` header and a `webhook_token` body field. Verify which one Shiprocket actually sends by inspecting your first real webhook payload in the Supabase `webhook_events` table.

---

## 6. Configure Resend (Transactional Email)

1. Sign up at [resend.com](https://resend.com)
2. **Domains** → Add and verify your sending domain (DNS records, ~5 min)
3. **API Keys** → Create a key → add to `.env.local` as `RESEND_API_KEY`
4. Set `RESEND_FROM_EMAIL` to an address on your verified domain

The app sends these emails automatically:

| Trigger | When |
|---|---|
| `ORDER_CONFIRMED` | Payment captured (Razorpay webhook) |
| `PAYMENT_FAILED` | Payment failed (Razorpay webhook) |
| `ORDER_PACKED` | Admin clicks "Create Shipment" |
| `ORDER_SHIPPED` | Shiprocket webhook: IN_TRANSIT status |
| `ORDER_OUT_FOR_DELIVERY` | Shiprocket webhook: OUT_FOR_DELIVERY |
| `ORDER_DELIVERED` | Shiprocket webhook: DELIVERED |
| `ORDER_CANCELLED` | Admin manually sets status to CANCELLED |
| `REFUND_INITIATED` | Admin manually sets status to REFUNDED |

Failed emails are retried automatically every 15 minutes (up to 3 attempts) via the Vercel cron at `/api/cron/retry-failed-emails`.

---

## 7. Upload Product Images (Optional)

1. Supabase → **Storage** → Create a public bucket called `product-images`
2. Upload images and copy the public URL
3. Update the `url` field in the `product_images` table

---

## 8. Production Hardening — Remaining TODOs

| Gap | Fix |
|---|---|
| Rate limiter is in-memory only | Replace `lib/rate-limit.ts` with `@upstash/ratelimit` + Redis |
| Inventory not decremented atomically | Add a Postgres function / `supabase.rpc()` call inside the Razorpay webhook after capture |
| Checkout not fully atomic | Wrap order creation steps in a Postgres function |

---

## 9. Admin Panel URLs

| Page | URL |
|---|---|
| Login | `/admin/login` |
| Dashboard | `/admin` |
| Orders | `/admin/orders` |
| Products | `/admin/products` |
| Inventory | `/admin/inventory` |
| Customers | `/admin/customers` |
| Reviews | `/admin/reviews` |
| Coupons | `/admin/coupons` |
