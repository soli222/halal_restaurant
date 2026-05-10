# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server at http://localhost:3007
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

To test Stripe webhooks locally, run in a separate terminal (Stripe CLI must be installed):
```bash
.\stripe listen --forward-to localhost:3007/api/webhook
```

## Architecture

This is a **Next.js 14 App Router** project — all routes live under `app/`.

### Pages

- `app/page.js` — Thin orchestrator. Composes all hooks, owns top-level state (`view`, `ownerStep`, `returningFromStripe`), and renders the correct view component based on state. Does **not** contain UI directly.
- `app/review/[id]/page.js` — Standalone shareable review page for a single restaurant (accessed via QR code or direct link).
- `app/admin/page.js` — Admin-only dashboard for approving/rejecting halal verification requests and managing review reports. Has two tabs: Verifications and Reports. Admin role is checked client-side via `users/{uid}.role === 'admin'` in Firestore, but all write actions go through `/api/admin/update-status` which re-verifies server-side. To grant admin access, manually set `role: 'admin'` on the user document in Firestore — there is no self-elevation path. Features: real-time `onSnapshot` listener for new requests, amber alert banner showing pending count, NEW badge on submissions within 24h, document lightbox with comparison panel, verification checklist (6 items, local session state), and registry lookup link (Google search for cert number + certifying body).
- `app/privacy/page.js` — Privacy Policy page.
- `app/terms/page.js` — Terms of Use page.
- `app/faq/page.js` — FAQ page with 5 sections (General, Halal Verification, Reviews, Restaurant Owners, Account & Privacy). Uses native `<details>`/`<summary>` accordion — no JS required.

### View components

- `app/components/HomeView/index.js` — Main homepage: hero, search/filter, restaurant grid, top rated, recently viewed, owner CTA. The informational sections and owner CTA are only shown when `!selected && (!user || userRole === 'customer' || (userRole === 'owner' && !onboardingComplete))`. Footer links to FAQ, Privacy Policy, and Terms of Use.
- `app/components/OwnerOnboarding.js` — 5-step owner verification flow (restaurant info → halal cert → documents → online presence → review & confirm). Verification review time is **7 business days**. Step 1 collects full address: Street Address (required), City (required), State/Province (optional), ZIP/Postal Code (optional).
- `app/components/OwnerDashboard/index.js` — Owner dashboard: verification status, linked restaurant profile editor, recent reviews, page view analytics chart, and notifications bell. Subscription management lives in a **Settings section** at the bottom (not inline). Supports cancel (with listing visibility warning + 2-step confirm), upgrade Basic→Pro, and re-subscribe after cancellation. Pro downgrade to Basic is **not allowed**. Notifications are fetched via `useNotifications`.
- `app/components/PostOnboardingSubscription.js` — Subscription prompt shown after owner completes verification. **No "skip" option** — a paid plan is required to activate the listing.
- `app/components/PricingView.js` — Pricing/upgrade page for customers. Plans: Basic $30/mo, Pro $50/mo.
- `app/components/RestaurantDetailView.js` — Full restaurant page: reviews, AI summary, analytics, reply, share, report review. Accepts `setSelected` prop — the Back button calls both `setSelected(null)` and `setView('home')` to fully reset navigation state.
- `app/components/RestaurantMap.js` / `RestaurantLocationMap.js` — Leaflet map components.
- `app/components/Toast.js` — Toast notification renderer.

### Hooks (all state lives here, not in page.js)

- `useAuth` — Firebase Auth (Google Sign-In), user/role state, onboarding completion. `handleRoleSelect` only accepts `'customer'` or `'owner'` — role elevation to `'admin'` is silently blocked.
- `useSubscription` — Stripe subscription status and checkout. `handleSubscribe` attaches a Firebase ID token to the checkout request. Also exposes `handleUpgrade` (Basic→Pro via `/api/upgrade-subscription`) and `handleCancel` (cancel at period end via `/api/cancel-subscription`). `fetchSubscription` does **not** set `loadingSub` — plan buttons are never disabled on page load. `isPro()` checks `subscription.amount === 5000` (Pro at $50/mo). `loadingSub` is `null | 'basic' | 'pro'` (not a boolean) so only the clicked plan button shows "Redirecting…".
- `useFavourites` — Favourites list, toggle, Firestore sync.
- `useRestaurants` — Restaurant list, selected restaurant, recently viewed, add restaurant. Recently viewed IDs are persisted in `localStorage` under the key `halalgotos_recent`. Also logs page views to the `analytics` collection (fire-and-forget) when a restaurant is opened.
- `useReviews` — Reviews, rating, photo upload, AI summary, speech-to-text, share, analytics, report review. All calls to `/api/summarize` and `/api/notify-owner` attach a Firebase ID token via `Authorization: Bearer <token>`. On new review submission, writes a notification to `notifications/{ownerId}/items` if the restaurant has an `ownerId`. Photo uploads are moderated via `moderateImage()` before preview is set — rejected images show a toast with the reason.
- `useOnboarding` — Owner onboarding form state and `submitVerification` (saves to Firestore/Storage at step 5 only). Collects `ownerStreetAddress`, `ownerCity`, `ownerState`, `ownerZip` in step 1. All image/document files are moderated via `moderateImage()` at submit time before upload — submission is aborted if any file is flagged.
- `useOwnerDashboard` — Fetches verification request, linked restaurant, recent reviews, and page view analytics from the `analytics` collection for the owner's restaurant. Manages `moderatingCover` state — cover image uploads are moderated before saving.
- `useNotifications` — Subscribes to `notifications/{user.uid}/items` via `onSnapshot`. Only active when user is signed in. Provides `notifications`, `unreadCount`, and `markAllRead`.
- `useSearch` — Search, cuisine/city/open-now filters, sort, suggestions, PWA install banner. Location filter is a typeahead input backed by `locationOptions` (flat list of `{ display, filterValue, type }` built from `r.city`+`r.state`, `r.state`, and `r.zip`). Exposes `locationSearch`, `showLocationDropdown`, `locationRef`, `visibleLocationOptions`, `selectLocation()`, `clearLocation()`. Main text search matches against `name`, `location`, `city`, `state`, `zip`, and `cuisine`. `handleSuggestionSelect` for city/state/zip also updates `locationSearch` display text.
- `useToast` — Toast queue.

### API Routes

All non-webhook API routes require a valid Firebase ID token in the `Authorization: Bearer <token>` header. Requests without a valid token receive a 401.

- `app/api/summarize/route.js` — Calls Anthropic Claude API (`claude-sonnet-4-20250514`) to generate AI review summaries. **`isPro` is determined server-side** by checking `subscriptions/{uid}` in Firestore — the client does not supply it. Free users get a 2–3 sentence summary; Pro users get a structured analytics report. Enforces input length limits.
- `app/api/create-checkout/route.js` — Creates Stripe Checkout sessions for Basic ($30/mo) and Pro ($50/mo) subscriptions with 7-day trial. `success_url` is `/?subscribed=1`. Validates that `userId` matches the authenticated token's UID, and validates `plan` against a whitelist (`basic`, `pro`).
- `app/api/cancel-subscription/route.js` — Cancels the owner's Stripe subscription at period end (`cancel_at_period_end: true`). Optimistically writes `cancelAtPeriodEnd: true` and `currentPeriodEnd` to Firestore. Requires Firebase ID token.
- `app/api/upgrade-subscription/route.js` — Upgrades Basic→Pro via Stripe subscription item update. Uses `proration_behavior: 'none'` — no charge today, Pro rate applies at next renewal. Requires Firebase ID token.
- `app/api/moderate-image/route.js` — Uses Anthropic Claude (`claude-haiku-4-5-20251001`) via direct `fetch` to the Anthropic REST API to classify uploaded images. Rejects nudity, drugs, violence, hate symbols, alcohol. Accepts food, restaurant photos, documents, people dining. PDFs pass through. Fails open on API error (does not block uploads if AI is unavailable).
- `app/api/webhook/route.js` — Stripe webhook handler; verifies Stripe signature, writes subscription status/plan to `subscriptions/{userId}` in Firestore via Admin SDK. On `customer.subscription.deleted`, writes `cancelledAt` timestamp. No auth token required (called by Stripe).
- `app/api/notify-owner/route.js` — Sends email notification to owner when a new review is posted. Validates `rating` against the allowed enum and caps `reviewText` at 2000 chars. All user content is HTML-escaped before being embedded in the email.
- `app/api/notify-verification/route.js` — Sends a "submission received" confirmation email to the restaurant owner immediately after they submit their verification request. Requires Firebase ID token. If `RESEND_API_KEY` is not set, skips silently without breaking the flow.
- `app/api/admin/update-status/route.js` — Also sends approval or rejection emails directly via Resend when admin approves/rejects a request (fire-and-forget, won't break the approval flow if email fails).
- `app/api/admin/update-status/route.js` — Server-side admin endpoint for approving/rejecting verification requests. Verifies Firebase token AND checks `users/{uid}.role === 'admin'` in Firestore before allowing any write. Validates `status` against `['approved', 'rejected', 'pending']`. **On approval, automatically creates a restaurant document** in the `restaurants` collection from the verification request data (idempotent — checks for existing `verificationRequestId` first). Restaurant document includes `streetAddress`, `city`, `state`, `zip`, and a combined `location` string. Also sends an in-app notification to the owner via `notifications/{userId}/items`.

### Libraries

- `app/lib/firebase.js` — Client SDK: exports `auth`, `db`, `storage`, `googleProvider`. Auth is Google Sign-In only.
- `app/lib/firebase-admin.js` — Admin SDK: exports `adminDb` (Firestore) and `adminAuth` (Auth). Used only in server-side API routes. Requires service account env vars.
- `app/lib/auth-helpers.js` — `verifyToken(request)` helper: extracts and verifies the Firebase ID token from the `Authorization: Bearer` header using `adminAuth.verifyIdToken()`. Returns `{ uid }` on success or `{ uid: null }` on failure.
- `app/lib/moderate-image.js` — Client utility: resizes image to max 1024px at 85% JPEG quality using Canvas, then calls `/api/moderate-image`. Returns `{ safe: boolean, reason: string | null }`. Skips non-image files. Fails open on network errors.

### Firestore collections

- `restaurants` — Restaurant documents. Fields include `name`, `city`, `state`, `zip`, `streetAddress`, `location` (combined string for legacy search), `cuisine`, `ownerId`, halal cert info, hours, urls, etc. Created automatically when a verification request is approved.
- `reviews` — Reviews top-level collection, keyed by restaurantId. Requires a composite index on `(restaurantId ASC, createdAt DESC)` — create via Firebase Console if missing.
- `users` — User profiles; `role` is `customer`, `owner`, or `admin`. Admin role must be set manually in Firestore — no self-elevation is possible.
- `subscriptions` — Subscription status per userId, written by Stripe webhook. Fields: `status`, `plan` (`basic`/`pro`), `amount` (3000 or 5000), `stripeSubscriptionId`, `cancelAtPeriodEnd`, `currentPeriodEnd`, `cancelledAt` (set on deletion), `updatedAt`.
- `verification_requests` — Halal verification submissions from restaurant owners (with proof documents, cert details, full address, status: pending/approved/rejected). Uses `addDoc` with auto-generated IDs and an `ownerId` field.
- `favourites` — Per-user favourited restaurant IDs.
- `analytics` — Page view events written when a restaurant is opened (restaurantId, userId, isAuthenticated, viewedAt). Public write, authenticated read. Used by `useOwnerDashboard` to compute stats.
- `notifications/{userId}/items` — Per-user notification subcollection. Written by the server (Admin SDK) on verification approval/rejection, and by `useReviews` when a new review is posted. Read by `useNotifications` via `onSnapshot`.
- `reports` — Review reports submitted by users (reviewId, reason, status: pending/resolved/dismissed). Authenticated write only; admin reads via the client SDK (Firestore rule checks `role == 'admin'`).

### Firebase Security Rules

Both Firestore and Storage require proper security rules — the default Firebase time-limited rules expire and will break the app. Rules must be set manually in Firebase Console.

**Firestore rules summary:**
- `restaurants`, `reviews` — public read; authenticated write
- `analytics` — public write (includes anonymous visitors); authenticated read
- `reports` — authenticated write; admin-only read (checks `users/{uid}.role == 'admin'` via Firestore `get()`)
- `verification_requests` — owner read/write for own submissions; admin can read all (checks `users/{uid}.role == 'admin'` via Firestore `get()`)
- `users`, `favourites`, `subscriptions`, `notifications/{userId}/items` — owner-only read/write (`request.auth.uid == userId`)
- `users` write additionally blocks `role: 'admin'` — only `'customer'` and `'owner'` are writable client-side

**Storage rules summary:**
- `verification_proofs/{userId}/**` — authenticated read; owner write
- `restaurant_covers/**`, `owner_covers/{userId}/**`, `review_photos/**` — public read; authenticated write

**Firebase Storage requires the Blaze (pay-as-you-go) plan** — it is not available on the Spark free plan for new projects. The Blaze plan has a generous free tier and costs nothing unless quotas are exceeded.

---

## User & auth flow

### Customer
- Signs in via Google popup (only prompted when attempting to leave a review or favourite a restaurant).
- Auto-assigned `role: 'customer'` in Firestore on first sign-in.
- No role picker screen — customers go straight to the homepage.

### Restaurant owner
Sign-in is deferred to the end of onboarding to reduce upfront friction:

1. Click **"List my restaurant →"** on the homepage → `ownerStep` is set to `1` in `page.js`, onboarding opens immediately — **no login prompt**.
2. Owner fills in steps 1–4 (restaurant info, halal cert, documents, online presence) as pure React state.
3. **Step 5 (Review & Confirm):** if not signed in, the submit button reads "Sign in with Google to submit →". Clicking it sets `pendingOwnerSubmit: true` and opens a Google popup. Because it's a popup (not a redirect), all React form state is preserved.
4. After sign-in, `onAuthStateChanged` detects `pendingOwnerSubmit`, assigns `role: 'owner'` in Firestore, and clears the flag. Step 5 re-renders with the regular "Submit for Verification" button.
5. Owner clicks submit → `submitVerification` (in `useOnboarding`) moderates all image files first, then uploads to Firebase Storage and saves all data to `verification_requests/{uid}` in Firestore with `status: 'pending'`.
6. Owner is taken to `PostOnboardingSubscription` screen (`ownerStep === 'subscription'`). **There is no skip option** — a plan must be chosen to proceed.
7. Owner selects a plan → Stripe Checkout opens. On return (`?subscribed=1`), `completeOnboarding()` sets `onboardingComplete: true` in Firestore and owner is taken to dashboard.

**Returning owners** who haven't finished onboarding are auto-resumed at step 1 via a `useEffect` in `page.js`:
```js
useEffect(() => {
  if (user && userRole === 'owner' && !onboardingComplete && ownerStep === null) {
    setOwnerStep(1);
  }
}, [user, userRole, onboardingComplete]);
```

### Stripe return flow
After Stripe Checkout, the user is redirected to `/?subscribed=1`. On mount, `page.js` detects this param, sets `returningFromStripe: true` (shows a loading spinner — prevents homepage flash), and stores a `pendingSubscriptionReturn` ref. When Firebase auth resolves, `completeOnboarding()` is called and the user is sent to the owner dashboard. The `?subscribed=1` param is cleared from the URL with `window.history.replaceState`.

### Subscription lifecycle
- **Active:** owner has `status: 'trialing'` or `'active'` in `subscriptions/{uid}`.
- **Cancel at period end:** `cancelAtPeriodEnd: true` — listing stays live until `currentPeriodEnd`. Dashboard shows warning that listing will go dark.
- **Cancelled (deleted):** `status: 'canceled'`, `cancelledAt` timestamp set. Listing hidden from public. **2-day grace period** — during the first 2 days after cancellation, a re-subscribe offer is shown in the dashboard. After 2 days, a stronger prompt is shown.
- **Upgrade Basic→Pro:** via `/api/upgrade-subscription`. Proration is `none` — Pro rate applies at next billing cycle. Pro downgrade to Basic is **not supported**.
- **No free tier:** owners without an active subscription cannot access the dashboard.

### Admin
- Role must be set manually in Firestore: `users/{uid}.role = 'admin'`.
- Access the admin dashboard at `/admin`.
- Can approve/reject verification requests — approval automatically creates the restaurant listing.
- Can resolve/dismiss review reports.

### `ownerStep` state
Lives in `page.js` (not in `useAuth`) so it survives before the user signs in. Values:
- `null` — no onboarding in progress
- `1–5` — active onboarding step
- `'subscription'` — post-onboarding subscription screen

---

## View routing (page.js)

Gates are evaluated top-to-bottom:

| Condition | Renders |
|---|---|
| `returningFromStripe` | Loading spinner (prevents homepage flash on Stripe return) |
| `ownerStep !== null && ownerStep !== 'subscription' && !(user && onboardingComplete)` | `OwnerOnboarding` |
| `user && userRole === 'owner' && ownerStep === 'subscription'` | `PostOnboardingSubscription` |
| `view === 'owner-dashboard' && user && userRole === 'owner'` | `OwnerDashboard` |
| `view === 'pricing'` | `PricingView` |
| `view === 'restaurant' && selected` | `RestaurantDetailView` |
| default | `HomeView` |

---

## Environment variables

Copy `.env.local.example` to `.env.local`. Required variables:

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase Console → Project Settings → Your Apps |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Firebase Console → Service Accounts → Generate private key |
| `ANTHROPIC_API_KEY` | console.anthropic.com — required for AI summaries and image moderation |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `STRIPE_PRO_PRICE_ID` | Stripe Dashboard |
| `NEXT_PUBLIC_APP_URL` | Base URL (e.g. `http://localhost:3007`) |
| `RESEND_API_KEY` | resend.com (optional — app works without it, owners just won't get email alerts) |
| `RESEND_FROM_EMAIL` | Sender address — must be `Halalgotos <notifications@halalgotos.com>` (domain must be verified in Resend) |

---

## Key implementation notes

- The app is dark-mode only (`bg-[#0A0A0A]` / `bg-[#050505]`), styled with Tailwind CSS and Poppins font (applied globally in `layout.js`).
- Rating values are `recommended`, `good`, `average`, `not_recommended` — not numeric stars.
- Cuisine types are defined in `app/constants/index.js` (`CUISINES` array). The onboarding dropdown includes an **"Other"** option — when selected, a text input appears for the owner to type their custom cuisine. The typed value is saved as `cuisineType` in Firestore (so search works naturally) and the raw input is also saved as `cuisineOther` for admin visibility.
- Stripe webhook must receive the raw request body (not parsed JSON) for signature verification — `route.js` uses `request.text()`.
- `FIREBASE_PRIVATE_KEY` in `.env.local` must have literal `\n` replaced with actual newlines, or the Admin SDK init will fail. The `firebase-admin.js` handles this with `.replace(/\\n/g, '\n')`.
- Firestore composite index required on `reviews` collection: `(restaurantId ASC, createdAt DESC)`. Create it via the link in the browser console error if missing.
- `submitVerification` in `useOnboarding` only writes to Firestore/Storage when called at step 5 — nothing is saved mid-onboarding.
- The homepage hero stats section shows trust highlights (icon + label) rather than numeric counts, to avoid inflated/misleading numbers before the platform has real scale.
- `RolePicker.js` has been deleted — there is no role picker screen. Role is assigned automatically (`customer` by default, `owner` via onboarding).
- Restaurant images fall back to `CUISINE_IMAGES[cuisine]` then `DEFAULT_FOOD_IMAGE` (both from Unsplash) when no `coverImageUrl` is set on the restaurant document.
- `next.config.js` sets security headers on all routes: `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`, and a `Content-Security-Policy`. When adding new external scripts or connect targets, update the CSP in `next.config.js`.
- The dev server runs on port **3007** (`next dev -p 3007`).
- When a restaurant is approved, a restaurant document is auto-created in `restaurants` collection by `/api/admin/update-status`. The document includes `ownerId`, `streetAddress`, `city`, `state`, `zip`, and `location` (a combined string built from those fields for backward-compatible text search).
- The `analytics` collection is written client-side (no auth required) so anonymous page views are captured. Owners can view their stats in the dashboard via a bar chart of the last 14 days.
- Image moderation uses Anthropic Claude Haiku via direct `fetch` (the `@anthropic-ai/sdk` package is **not** installed — use `fetch` to `https://api.anthropic.com/v1/messages` as done in `summarize/route.js` and `moderate-image/route.js`).
- "Already listed? Sign in" button: if the signed-in user has no owner account, a friendly modal is shown explaining they need to list their restaurant first (not a red error toast).
- Certification expiry date input uses `[color-scheme:dark]` CSS class so the native calendar icon renders white on dark backgrounds.
- Stale Firestore notifications (from before text copy was updated) may appear in the notification bell with outdated wording — clear them manually in Firebase Console under `notifications/{userId}/items` during development.
- Recently viewed restaurant IDs are stored in `localStorage` under the key `halalgotos_recent` (5 max). Loaded on mount via `useEffect` in `page.js`.
- Contact email for support is `halalgotos@gmail.com`. This appears as a `mailto:` link in the Privacy Policy, Terms of Use, and FAQ pages.
- The location filter in `useSearch` is a typeahead input (not a `<select>`). It builds `locationOptions` dynamically from restaurant `city`+`state`, `state`, and `zip` fields. The list grows automatically as new restaurants are approved — no manual curation needed.
- **Profanity filter:** `app/lib/profanity-filter.js` exports `cleanProfanity(text)` which returns `{ cleaned, found }`. Called in `useReviews` at submit time — if profanity is found, the censored text is written back to the review box, a toast is shown, and submission is blocked so the user can review and re-submit.
- **Onboarding certifying body "Other":** When "Other" is selected in step 2, a textarea appears for the owner to describe their certifying body (saved as `certOtherDetails` in Firestore). Shown as an amber highlighted box in the admin dashboard.
- **Onboarding cert number N/A:** A checkbox "I don't have a certification number" in step 2 disables the number input and shows a textarea for explanation (saved as `certNumberNA: true` and `certNumberNADetails`). Shown as a blue highlighted box in admin.
- **Onboarding cuisine "Other":** Step 1 has an "Other" option in the cuisine dropdown. When selected, a text input appears (saved as `cuisineType` = typed value, `cuisineOther` = raw input). Shown as a purple highlighted box in admin.
- **Firebase Auth popup error:** `handleLogin` in `useAuth` catches `INTERNAL ASSERTION FAILED` errors (thrown when popup is dismissed mid-flow) and treats them as silent cancellations — prevents the Next.js error overlay from appearing.

---

## Privacy & Legal Pages

- `/privacy` — Privacy Policy at `app/privacy/page.js`
- `/terms` — Terms of Use at `app/terms/page.js`
- `/faq` — FAQ at `app/faq/page.js`
- Footer links to all three pages appear in `HomeView`, and each legal/FAQ page links back to the homepage.
- Contact email on all pages: `halalgotos@gmail.com` (rendered as a `mailto:` link).

---

## Pre-Production Checklist

### 🔴 Must-have (blockers)

1. **Vercel deployment** ✅ Complete
   - Deployed at `halalgotos.com` — site is live and accessible
   - All env vars set in Vercel (except `ANTHROPIC_API_KEY` — pending)
   - `NEXT_PUBLIC_APP_URL` set to `https://halalgotos.com`

2. **Stripe live keys** ✅ Complete
   - Live secret key (`sk_live_...`) set in Vercel
   - Live price IDs set: Basic `price_1TUz6KJDRCusTIGkgmSTUI89`, Pro `price_1TUz6IJDRCusTIGk33DMOeOM`
   - Webhook registered at `https://halalgotos.com/api/webhook` — 4 events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - `STRIPE_WEBHOOK_SECRET` (`whsec_...`) set in Vercel
   - ⚠️ Stripe account payout review in progress (2-3 days) — payments will process but payouts held until approved
   - ⚠️ Still need to test the full subscription flow end-to-end with a real card

3. **Firebase production setup** ✅ Complete
   - Firestore security rules already deployed and active
   - `halalgotos.com` and `www.halalgotos.com` added to Firebase authorized domains

4. **Admin account** ⏳ Pending
   - Need to sign in to `halalgotos.com` first to create the user document
   - Then go to Firebase Console → Firestore → `users` collection → find your UID doc → set `role: 'admin'`
   - Verify admin dashboard works at `halalgotos.com/admin`

5. **Anthropic API key** ⏳ Pending
   - Not yet set in Vercel — image moderation and AI summaries are currently disabled
   - Get key from `console.anthropic.com` → API Keys → Create Key (`sk-ant-...`)
   - Add as `ANTHROPIC_API_KEY` in Vercel env vars → redeploy

6. **Seed content** ⏳ Pending
   - Site is live but has no restaurants — need at least a few approved listings before promoting
   - Submit test restaurants through the onboarding flow and approve via admin dashboard

### 🟡 Should-have (high impact, low effort)

7. **Resend (email)** ✅ Complete
   - Domain `halalgotos.com` verified in Resend — emails send from `notifications@halalgotos.com`
   - `RESEND_API_KEY` and `RESEND_FROM_EMAIL` set in Vercel env vars
   - 3 automated emails: submission confirmation, approval, rejection

8. **Error monitoring (Sentry)** — deferred, revisit post-launch
   - Sentry free tier is only 14 days trial — not worth setting up yet
   - Use Vercel's built-in Runtime Logs in the meantime

9. **Rate limiting**
   - No rate limiting on API routes yet — at minimum protect `/api/create-checkout` and `/api/summarize`
   - Recommended: Upstash Redis + `@upstash/ratelimit` middleware, or Vercel/Cloudflare layer

10. **SEO basics**
    - No `sitemap.xml` or `robots.txt` — add so search engines can index restaurant pages
    - No Open Graph / social preview image — links shared on WhatsApp/Twitter show blank previews
    - Note: new domains are sometimes blocked by DNS filters as "New Domains" category — resolves naturally as domain ages

### 🟢 Nice-to-have (post-launch fine)

11. **Vercel Analytics** — free, one line to add (`import { Analytics } from '@vercel/analytics/react'` in `layout.js`), gives real visitor data
12. **Custom 404 page** — currently falls back to Next.js default; add `app/not-found.js`
13. **PWA icons** — verify `manifest.json` has proper sized icons (`192x192`, `512x512`) in `/public`
14. **Pagination / infinite scroll** — once 50+ restaurants, single page load will get slow
15. **Admin search** — no way to search/filter pending verification requests in the admin dashboard if volume grows
