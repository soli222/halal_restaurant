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

### Pages

- `app/page.js` — Thin orchestrator (~200 lines). Composes all hooks, owns top-level state (`view`, `ownerStep`), and renders the correct view component based on state. Does **not** contain UI directly.
- `app/review/[id]/page.js` — Standalone shareable review page for a single restaurant (accessed via QR code or direct link).
- `app/admin/page.js` — Admin-only dashboard for approving/rejecting halal verification requests. Admin role is checked via `users/{uid}.role === 'admin'` in Firestore.

### View components

- `app/components/HomeView/index.js` — Main homepage: hero, search/filter, restaurant grid, top rated, recently viewed, owner CTA.
- `app/components/OwnerOnboarding.js` — 5-step owner verification flow (restaurant info → halal cert → documents → online presence → review & confirm).
- `app/components/PostOnboardingSubscription.js` — Subscription prompt shown after owner completes verification.
- `app/components/PricingView.js` — Pricing/upgrade page for customers.
- `app/components/RestaurantDetailView.js` — Full restaurant page: reviews, AI summary, analytics, reply, share.
- `app/components/RestaurantMap.js` / `RestaurantLocationMap.js` — Leaflet map components.
- `app/components/Toast.js` — Toast notification renderer.

### Hooks (all state lives here, not in page.js)

- `useAuth` — Firebase Auth (Google Sign-In), user/role state, onboarding completion.
- `useSubscription` — Stripe subscription status and checkout.
- `useFavourites` — Favourites list, toggle, Firestore sync.
- `useRestaurants` — Restaurant list, selected restaurant, recently viewed, add restaurant.
- `useReviews` — Reviews, rating, photo upload, AI summary, speech-to-text, share, analytics.
- `useOnboarding` — Owner onboarding form state and `submitVerification` (saves to Firestore/Storage at step 5 only).
- `useSearch` — Search, cuisine/city/open-now filters, sort, suggestions, PWA install banner.
- `useToast` — Toast queue.

### API Routes

- `app/api/summarize/route.js` — Calls Anthropic Claude API (`claude-sonnet-4-20250514`) to generate AI review summaries. Free users get a 2–3 sentence summary; Pro users get a structured analytics report.
- `app/api/create-checkout-route.js` — Creates Stripe Checkout sessions for Basic ($20/mo) and Pro ($30/mo) subscriptions with 7-day trial.
- `app/api/webhook/route.js` — Stripe webhook handler; writes subscription status/plan to `subscriptions/{userId}` in Firestore via Admin SDK.
- `app/api/notify-owner/route.js` — Sends email notification to owner when a new review is posted.

### Firebase

- `app/lib/firebase.js` — Client SDK: exports `auth`, `db`, `storage`, `googleProvider`. Auth is Google Sign-In only.
- `app/lib/firebase-admin.js` — Admin SDK: used only in server-side API routes (webhook). Requires service account env vars.

### Firestore collections

- `restaurants` — Restaurant documents (name, city, cuisine, address, hours, halal cert info, etc.)
- `reviews` — Reviews subcollection or top-level, keyed by restaurantId
- `users` — User profiles; `role` is `customer`, `owner`, or `admin`
- `subscriptions` — Subscription status per userId, written by webhook
- `verification_requests` — Halal verification submissions from restaurant owners (with proof documents, cert details)
- `favourites` — Per-user favourited restaurant IDs

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
5. Owner clicks submit → `submitVerification` (in `useOnboarding`) saves all data to Firestore/Storage.
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
| `NEXT_PUBLIC_APP_URL` | Base URL (e.g. `http://localhost:3000`) |

---

## Key implementation notes

- The app is dark-mode only (`bg-[#0A0A0A]` / `bg-[#050505]`), styled with Tailwind CSS and Poppins font (applied globally in `layout.js`).
- Rating values are `recommended`, `good`, `average`, `not_recommended` — not numeric stars.
- Stripe webhook must receive the raw request body (not parsed JSON) for signature verification — `route.js` uses `request.text()`.
- `FIREBASE_PRIVATE_KEY` in `.env.local` must have literal `\n` replaced with actual newlines, or the Admin SDK init will fail. The `firebase-admin.js` handles this with `.replace(/\\n/g, '\n')`.
- Firestore indexes may need to be created manually — the browser console will show a link to create them if a compound query fails.
- `submitVerification` in `useOnboarding` only writes to Firestore/Storage when called at step 5 — nothing is saved mid-onboarding.
- The homepage hero stats section shows trust highlights (icon + label) rather than numeric counts, to avoid inflated/misleading numbers before the platform has real scale.
- `RolePicker.js` has been deleted — there is no role picker screen. Role is assigned automatically (`customer` by default, `owner` via onboarding).
