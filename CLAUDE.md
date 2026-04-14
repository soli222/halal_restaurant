# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server at http://localhost:3000
npm run build    # Production build
npm run start    # Start production server
```

There are no tests or linting configured.

To seed restaurants into Firestore, run one of the seed scripts directly with Node:
```bash
node seed-restaurants.mjs
node seed-halal-restaurants.mjs
node seed-more-cities.mjs
```

## Architecture

This is a **Next.js 14 App Router** project — all routes live under `app/`.

**Pages:**
- `app/page.js` — Main SPA: restaurant listing, search/filter, review submission, subscription/upgrade flow, owner verification. This file is very large (~1000+ lines) and contains the entire front-end in one client component.
- `app/review/[id]/page.js` — Standalone shareable review page for a single restaurant (accessed via QR code or direct link).
- `app/admin/page.js` — Admin-only dashboard for approving/rejecting halal verification requests. Admin role is checked via `users/{uid}.role === 'admin'` in Firestore.

**API Routes:**
- `app/api/summarize/route.js` — Calls Anthropic Claude API (`claude-sonnet-4-20250514`) to generate AI review summaries. Free users get a 2–3 sentence summary; Pro users get a structured analytics report.
- `app/api/create-checkout-route.js` — Creates Stripe Checkout sessions for Basic ($20/mo) and Pro ($30/mo) subscriptions with 7-day trial.
- `app/api/webhook/route.js` — Stripe webhook handler; writes subscription status/plan to `subscriptions/{userId}` in Firestore via Admin SDK.

**Firebase:**
- `app/lib/firebase.js` — Client SDK: exports `auth`, `db`, `storage`, `googleProvider`. Auth is Google Sign-In only.
- `app/lib/firebase-admin.js` — Admin SDK: used only in server-side API routes (webhook). Requires service account env vars.

**Firestore collections:**
- `restaurants` — Restaurant documents (name, city, cuisine, address, hours, halal cert info, etc.)
- `reviews` — Reviews subcollection or top-level, keyed by restaurantId
- `users` — User profiles; `role: 'admin'` grants admin access
- `subscriptions` — Subscription status per userId, written by webhook
- `verification_requests` — Halal verification submissions from restaurant owners (with proof documents, cert details)

## Environment variables

Copy `.env.local.example` to `.env.local`. Required variables:

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase Console → Project Settings → Your Apps |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Firebase Console → Service Accounts → Generate private key |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `STRIPE_PRO_PRICE_ID` | Stripe Dashboard |
| `NEXT_PUBLIC_APP_URL` | Base URL (e.g. `http://localhost:3000`) |

## Key implementation notes

- The app is dark-mode only (`bg-[#0A0A0A]`), styled with Tailwind CSS and Poppins font.
- Rating values are `recommended`, `good`, `average`, `not_recommended` — not `good`/`bad`.
- Stripe webhook must receive the raw request body (not parsed JSON) for signature verification — `route.js` uses `request.text()`.
- `FIREBASE_PRIVATE_KEY` in `.env.local` must have literal `\n` replaced with actual newlines, or the Admin SDK init will fail. The `firebase-admin.js` handles this with `.replace(/\\n/g, '\n')`.
- Firestore indexes may need to be created manually — the browser console will show a link to create them if a compound query fails.
