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

## Architecture

This is a **Next.js 14 App Router** project — all routes live under `app/`.

### Pages

- `app/page.js` — Thin orchestrator. Composes all hooks, owns top-level state (`view`, `ownerStep`), and renders the correct view component based on state. Does **not** contain UI directly.
- `app/review/[id]/page.js` — Standalone shareable review page for a single restaurant (accessed via QR code or direct link).
- `app/admin/page.js` — Admin-only dashboard for approving/rejecting halal verification requests and managing review reports. Has two tabs: Verifications and Reports. Admin role is checked client-side via `users/{uid}.role === 'admin'` in Firestore, but all write actions go through `/api/admin/update-status` which re-verifies server-side. To grant admin access, manually set `role: 'admin'` on the user document in Firestore — there is no self-elevation path.

### View components

- `app/components/HomeView/index.js` — Main homepage: hero, search/filter, restaurant grid, top rated, recently viewed, owner CTA. The informational sections and owner CTA are only shown when `!selected && (!user || userRole === 'customer' || (userRole === 'owner' && !onboardingComplete))`.
- `app/components/OwnerOnboarding.js` — 5-step owner verification flow (restaurant info → halal cert → documents → online presence → review & confirm).
- `app/components/OwnerDashboard/index.js` — Owner dashboard: verification status, linked restaurant profile editor, recent reviews, page view analytics chart, and notifications bell. Notifications are fetched via `useNotifications`.
- `app/components/PostOnboardingSubscription.js` — Subscription prompt shown after owner completes verification.
- `app/components/PricingView.js` — Pricing/upgrade page for customers.
- `app/components/RestaurantDetailView.js` — Full restaurant page: reviews, AI summary, analytics, reply, share, report review. Accepts `setSelected` prop — the Back button calls both `setSelected(null)` and `setView('home')` to fully reset navigation state.
- `app/components/RestaurantMap.js` / `RestaurantLocationMap.js` — Leaflet map components.
- `app/components/Toast.js` — Toast notification renderer.

### Hooks (all state lives here, not in page.js)

- `useAuth` — Firebase Auth (Google Sign-In), user/role state, onboarding completion. `handleRoleSelect` only accepts `'customer'` or `'owner'` — role elevation to `'admin'` is silently blocked.
- `useSubscription` — Stripe subscription status and checkout. `handleSubscribe` attaches a Firebase ID token to the checkout request.
- `useFavourites` — Favourites list, toggle, Firestore sync.
- `useRestaurants` — Restaurant list, selected restaurant, recently viewed, add restaurant. Also logs page views to the `analytics` collection (fire-and-forget) when a restaurant is opened.
- `useReviews` — Reviews, rating, photo upload, AI summary, speech-to-text, share, analytics, report review. All calls to `/api/summarize` and `/api/notify-owner` attach a Firebase ID token via `Authorization: Bearer <token>`. On new review submission, writes a notification to `notifications/{ownerId}/items` if the restaurant has an `ownerId`.
- `useOnboarding` — Owner onboarding form state and `submitVerification` (saves to Firestore/Storage at step 5 only).
- `useOwnerDashboard` — Fetches verification request, linked restaurant, recent reviews, and page view analytics from the `analytics` collection for the owner's restaurant.
- `useNotifications` — Subscribes to `notifications/{user.uid}/items` via `onSnapshot`. Only active when user is signed in. Provides `notifications`, `unreadCount`, and `markAllRead`.
- `useSearch` — Search, cuisine/city/open-now filters, sort, suggestions, PWA install banner.
- `useToast` — Toast queue.

### API Routes

All non-webhook API routes require a valid Firebase ID token in the `Authorization: Bearer <token>` header. Requests without a valid token receive a 401.

- `app/api/summarize/route.js` — Calls Anthropic Claude API (`claude-sonnet-4-20250514`) to generate AI review summaries. **`isPro` is determined server-side** by checking `subscriptions/{uid}` in Firestore — the client does not supply it. Free users get a 2–3 sentence summary; Pro users get a structured analytics report. Enforces input length limits.
- `app/api/create-checkout/route.js` — Creates Stripe Checkout sessions for Basic ($20/mo) and Pro ($30/mo) subscriptions with 7-day trial. Validates that `userId` matches the authenticated token's UID, and validates `plan` against a whitelist (`basic`, `pro`).
- `app/api/webhook/route.js` — Stripe webhook handler; verifies Stripe signature, writes subscription status/plan to `subscriptions/{userId}` in Firestore via Admin SDK. No auth token required (called by Stripe).
- `app/api/notify-owner/route.js` — Sends email notification to owner when a new review is posted. Validates `rating` against the allowed enum and caps `reviewText` at 2000 chars. All user content is HTML-escaped before being embedded in the email.
- `app/api/admin/update-status/route.js` — Server-side admin endpoint for approving/rejecting verification requests. Verifies Firebase token AND checks `users/{uid}.role === 'admin'` in Firestore before allowing any write. Validates `status` against `['approved', 'rejected', 'pending']`. **On approval, automatically creates a restaurant document** in the `restaurants` collection from the verification request data (idempotent — checks for existing `ownerId` first). Also sends an in-app notification to the owner via `notifications/{userId}/items`.

### Firebase

- `app/lib/firebase.js` — Client SDK: exports `auth`, `db`, `storage`, `googleProvider`. Auth is Google Sign-In only.
- `app/lib/firebase-admin.js` — Admin SDK: exports `adminDb` (Firestore) and `adminAuth` (Auth). Used only in server-side API routes. Requires service account env vars.
- `app/lib/auth-helpers.js` — `verifyToken(request)` helper: extracts and verifies the Firebase ID token from the `Authorization: Bearer` header using `adminAuth.verifyIdToken()`. Returns `{ uid }` on success or `{ uid: null }` on failure.

### Firestore collections

- `restaurants` — Restaurant documents (name, city, cuisine, ownerId, halal cert info, hours, urls, etc.). Created automatically when a verification request is approved.
- `reviews` — Reviews top-level collection, keyed by restaurantId. Requires a composite index on `(restaurantId ASC, createdAt DESC)` — create via Firebase Console if missing.
- `users` — User profiles; `role` is `customer`, `owner`, or `admin`. Admin role must be set manually in Firestore — no self-elevation is possible.
- `subscriptions` — Subscription status per userId, written by Stripe webhook.
- `verification_requests` — Halal verification submissions from restaurant owners (with proof documents, cert details, status: pending/approved/rejected). Document ID is the owner's `userId`.
- `favourites` — Per-user favourited restaurant IDs.
- `analytics` — Page view events written when a restaurant is opened (restaurantId, userId, isAuthenticated, viewedAt). Public write, authenticated read. Used by `useOwnerDashboard` to compute stats.
- `notifications/{userId}/items` — Per-user notification subcollection. Written by the server (Admin SDK) on verification approval/rejection, and by `useReviews` when a new review is posted. Read by `useNotifications` via `onSnapshot`.
- `reports` — Review reports submitted by users (reviewId, reason, status: pending/resolved/dismissed). Authenticated write only; admin reads via the Admin SDK in `app/admin/page.js`.

### Firebase Security Rules

Both Firestore and Storage require proper security rules — the default Firebase time-limited rules expire and will break the app. Rules must be set manually in Firebase Console.

**Firestore rules summary:**
- `restaurants`, `reviews` — public read; authenticated write
- `analytics` — public write (includes anonymous visitors); authenticated read
- `reports` — authenticated write; no client read (admin only via Admin SDK)
- `users`, `favourites`, `subscriptions`, `verification_requests`, `notifications/{userId}/items` — owner-only read/write (`request.auth.uid == userId`)

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
5. Owner clicks submit → `submitVerification` (in `useOnboarding`) uploads files to Firebase Storage and saves all data to `verification_requests/{uid}` in Firestore with `status: 'pending'`.
6. Owner is taken to `PostOnboardingSubscription` screen (`ownerStep === 'subscription'`).
7. After subscribing (or skipping), `completeOnboarding()` sets `onboardingComplete: true` in Firestore and clears `ownerStep`.

**Returning owners** who haven't finished onboarding are auto-resumed at step 1 via a `useEffect` in `page.js`:
```js
useEffect(() => {
  if (user && userRole === 'owner' && !onboardingComplete && ownerStep === null) {
    setOwnerStep(1);
  }
}, [user, userRole, onboardingComplete]);
```

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
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `STRIPE_PRO_PRICE_ID` | Stripe Dashboard |
| `NEXT_PUBLIC_APP_URL` | Base URL (e.g. `http://localhost:3007`) |
| `RESEND_API_KEY` | resend.com |
| `RESEND_FROM_EMAIL` | Sender address (e.g. `HalalSpot <notifications@yourdomain.com>`) |

---

## Key implementation notes

- The app is dark-mode only (`bg-[#0A0A0A]` / `bg-[#050505]`), styled with Tailwind CSS and Poppins font (applied globally in `layout.js`).
- Rating values are `recommended`, `good`, `average`, `not_recommended` — not numeric stars.
- Stripe webhook must receive the raw request body (not parsed JSON) for signature verification — `route.js` uses `request.text()`.
- `FIREBASE_PRIVATE_KEY` in `.env.local` must have literal `\n` replaced with actual newlines, or the Admin SDK init will fail. The `firebase-admin.js` handles this with `.replace(/\\n/g, '\n')`.
- Firestore composite index required on `reviews` collection: `(restaurantId ASC, createdAt DESC)`. Create it via the link in the browser console error if missing.
- `submitVerification` in `useOnboarding` only writes to Firestore/Storage when called at step 5 — nothing is saved mid-onboarding.
- The homepage hero stats section shows trust highlights (icon + label) rather than numeric counts, to avoid inflated/misleading numbers before the platform has real scale.
- `RolePicker.js` has been deleted — there is no role picker screen. Role is assigned automatically (`customer` by default, `owner` via onboarding).
- Restaurant images fall back to `CUISINE_IMAGES[cuisine]` then `DEFAULT_FOOD_IMAGE` (both from Unsplash) when no `coverImageUrl` is set on the restaurant document.
- `next.config.js` sets security headers on all routes: `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`, and a `Content-Security-Policy`. When adding new external scripts or connect targets, update the CSP in `next.config.js`.
- The dev server runs on port **3007** (`next dev -p 3007`).
- When a restaurant is approved, a restaurant document is auto-created in `restaurants` collection by `/api/admin/update-status`. The document includes `ownerId` (the owner's uid) which is used by `useOwnerDashboard` to find the linked restaurant.
- The `analytics` collection is written client-side (no auth required) so anonymous page views are captured. Owners can view their stats in the dashboard via a bar chart of the last 14 days.
