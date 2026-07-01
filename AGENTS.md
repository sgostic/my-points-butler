<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Base instructions

## Project

- **my-points-butler** — a Next.js 16 (App Router) app using React 19, TypeScript, and Tailwind CSS v4.

## Verification

Verify changes only with automated checks. **Do NOT perform manual testing** (no running the dev server, no clicking through the app, no browser-based verification).

Use these commands to verify:

- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Typecheck:** `npx tsc --noEmit`

## Conventions

- This is Next.js 16 with breaking changes from older versions — consult `node_modules/next/dist/docs/` before writing code (see above).
- Use the App Router, Server Components by default, and TypeScript throughout.

## Product

**My Points Butler** is a travel-rewards app built around the question _"Should I use my points now, or save them for a better trip later?"_ The UI is a vibrant, light, sky-blue → cyan → green aesthetic (green = savings). The designs originate from Claude Design (claude.ai/design) handoff bundles and are recreated pixel-faithfully as React components.

- **Fonts:** Bricolage Grotesque (`--font-head`), Plus Jakarta Sans (`--font-body`), Space Grotesk (`--font-num`) — loaded via `next/font/google` in `app/layout.tsx` and exposed as CSS variables. Do not re-add `<link>`-based Google Fonts.
- Components use the `pb-` class prefix and plain CSS files (not Tailwind utilities) to match the original design fidelity.

## A/B test & page variants

The homepage (`app/page.tsx`) is an A/B test. It's a Server Component that awaits `searchParams`, resolves `?variant=` and renders the matching variant. Default is variant **a**; unknown/missing values fall back to **a**.

- **`components/pages/index.ts`** — the variant registry: `VARIANTS` map (`a`/`b`/`c`/`d`), `DEFAULT_VARIANT`, and `resolveVariant()`. Wire new variants here.
- **`components/pages/mode-nav.tsx`** — `PBModeNav`, the shared top nav with the 4-mode switch (Planner · Alerts · Goals · Discover), each linking to its `?variant=` param. Used by variants C and D.
- **`components/pages/variant-a/`** — _Use-now planner_ (the polished default). Files: `index.tsx` (page, `"use client"`), `data.ts` (the **canonical data source** — destinations with offers + discovery metadata (`tags`/`nights`/`vibe`), plus `verdictFor`/`summarize`/`fmt`/`tripCost`/`INTERESTS`), `world-map.tsx` (canvas dotted world map + clickable pins — **reusable**), `variant-a.css` (base styles, imported by all variants).
- **`components/pages/variant-b/`** — _Wallet-matched Deal Alerts_. Reuses A's `data.ts`, `world-map.tsx`, and `variant-a.css`. Adds `wallet.ts` (wallet/pool/match logic) and `variant-b.css`. `variant-b.css` is the **shared "alerts" stylesheet** (wallet builder, fields, match badges, coverage bars, mode-switch) — C and D import it too.
- **`components/pages/variant-c/`** — _Goal tracking_ (save / earn / use). Reuses the map + data + `PBModeNav`; adds `goals.ts` (`pbPlanGoals`/`pbEta`) and `variant-c.css`. Imports `variant-a.css` + `variant-b.css` + `variant-c.css`.
- **`components/pages/variant-d/`** — _Personalized trip discovery_ (taste-driven feed, no map). Reuses data + `PBModeNav`; adds `variant-d.css`. Imports `variant-a.css` + `variant-b.css` + `variant-d.css`.

CSS layering mirrors the original bundle: every variant loads `variant-a.css` (base) first; B/C/D then load `variant-b.css` (shared alerts components) before their own. When adding destinations or changing economics/metadata, edit `components/pages/variant-a/data.ts` — **all four variants consume it**. Reuse `world-map.tsx`, `mode-nav.tsx`, and the shared stylesheets rather than duplicating.

## Onboarding flow (`/start`)

The `/start` route is a standalone, client-driven onboarding funnel, separate from the A/B homepage. It recreates a Claude Design handoff but uses the project's cream/forest-green palette (not the screenshot's blue).

- **`app/start/page.tsx`** — Server Component route that sets page `metadata` and renders `<PBStart />`.
- **`components/pages/start/index.tsx`** — `"use client"`. `PBStart` is a single component holding a `phase` state machine (`"hero" → "quiz" → "building" → "email"`) plus the local answer state. Sub-components: `PBTopNav` (brand + optional progress bar + "Step X of N" + "Exit"), `PBHero` (split hero: badge · gradient "guesswork" headline · CTA · `sunny-beach.webp` via `next/image`), `PBQuiz`, `PBBuilding`, `PBEmail`.
- **`components/pages/start/start.css`** — standalone stylesheet with a `pb-start-` / `pb-quiz-` / `pb-build-` / `pb-cap-` class prefix. It **re-declares its own palette tokens** at `.pb-start` (does not depend on `variant-a.css`). Fully responsive.
- **Questionnaire** — `QUESTIONS` array (6 steps): travel frequency, travel companions (single-select radios); rewards held (`multi: true` → checkboxes, multiple selections; selecting "Other" reveals a free-text input); points balance, priority, and hardest-part (single-select radios). "Continue" is disabled until answered; the last step reads "See my plan".

  | #   | Question                                         | Type             | Options                                                                                                                                                                                                                             |
  | --- | ------------------------------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | 1   | How many times do you travel a year?             | Single           | 1 – 2 · 3 – 5 · 6+                                                                                                                                                                                                                  |
  | 2   | Who do you travel with?                          | Single           | Alone · Partner · Family                                                                                                                                                                                                            |
  | 3   | Which rewards do you currently have?             | Multi (checkbox) | Chase · Amex · Capital One · Citi · Airline miles · Hotel points · Not sure · Other _(+ free-text input when "Other" selected)_                                                                                                     |
  | 4   | About how many points or miles do you have?      | Single           | Under 50,000 · 50,000 – 150,000 · 150,000 – 300,000 · 300,000+                                                                                                                                                                      |
  | 5   | What is your priority?                           | Single           | Flights · Hotels · Cashback · All above                                                                                                                                                                                             |
  | 6   | What's the hardest part about using your points? | Single           | Knowing if points are worth using · Choosing cash vs. points · Figuring out where to transfer · Finding the best trip / redemption · Picking the right card to use · Tracking everything · Knowing whether to save points for later |

- **Building phase** — `BUILD_STEPS` array; a CSS spinner plus rows that reveal one at a time (outlined circle → fills green with a checkmark), then auto-advances to the email phase.
- **Email** — `PBEmail` validates the address before enabling "Get My Plan"; submitting **or** "Skip for now" navigates to the homepage (`/`) via `useRouter` from `next/navigation`.
- **Logo** — reuses `PBNavMark` from `components/pages/nav-mark.tsx`; do not swap the mark.
- **Status: UI only** — no analytics, no email persistence, no backend. Wire `track*` helpers / the `email_subscriptions` table later if needed.

## Analytics & event tracking

User activity is logged to Supabase as an append-only `events` stream plus normalized projection tables. **Full reference: [`docs/ANALYTICS.md`](docs/ANALYTICS.md).** The essentials:

- **Schema:** `supabase/migrations/0001_analytics.sql` (run in Supabase). Tables: `visitors`, `sessions`, `events`, `feedback_submissions`, `email_subscriptions`, `contact_messages`, `donations`, `chat_messages`. RLS is locked down — writes happen only via the service-role key.
- **Migrations rule:** ALL database changes go in `supabase/migrations/` as a **new, sequentially-numbered file** (`0002_*.sql`, `0003_*.sql`, …) — never edit an already-applied migration (e.g. `0001_analytics.sql`). One migration per logical change, named `NNNN_short_description.sql`, applied in order in Supabase.
- **Client:** `lib/analytics/` — call `track(EVENTS.X, { ... })` (or a typed helper like `trackCardAdded`, `trackGate`, `trackFeedback`) from any client component. `AnalyticsProvider` (mounted in `app/layout.tsx`) auto-captures page views, scroll depth, time-on-page, and visitor→user linking.
- **Ingest:** `app/api/track/route.ts` (Node runtime) batches in via `navigator.sendBeacon`/`fetch`, writes with `lib/supabase/admin.ts` (service role). Needs `SUPABASE_SERVICE_ROLE_KEY` or `STORAGE_SUPABASE_SERVICE_ROLE_KEY`.
- **Identity:** durable `pb_vid` cookie minted in `lib/supabase/proxy.ts`; per-tab `pb_sid` session.
- **Rule:** canonical event names live in BOTH the SQL `event_name` enum and the `EVENTS` map in `lib/analytics/events.ts` — keep them in sync.
- **Not-yet-built features** (share, email subscribe, contact, donate, chatbot) already have tables + ingest routing + `track*` helpers ready; just call the helper when you build the UI. See `docs/ANALYTICS.md` → "To wire when the feature is built".
