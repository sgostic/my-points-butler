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

**My Points Butler** is a travel-rewards app built around the question *"Should I use my points now, or save them for a better trip later?"* The UI is a vibrant, light, sky-blue → cyan → green aesthetic (green = savings). The designs originate from Claude Design (claude.ai/design) handoff bundles and are recreated pixel-faithfully as React components.

- **Fonts:** Bricolage Grotesque (`--font-head`), Plus Jakarta Sans (`--font-body`), Space Grotesk (`--font-num`) — loaded via `next/font/google` in `app/layout.tsx` and exposed as CSS variables. Do not re-add `<link>`-based Google Fonts.
- Components use the `pb-` class prefix and plain CSS files (not Tailwind utilities) to match the original design fidelity.

## A/B test & page variants

The homepage (`app/page.tsx`) is an A/B test. It's a Server Component that awaits `searchParams`, resolves `?variant=` and renders the matching variant. Default is variant **a**; unknown/missing values fall back to **a**.

- **`components/pages/index.ts`** — the variant registry: `VARIANTS` map (`a`/`b`/`c`/`d`), `DEFAULT_VARIANT`, and `resolveVariant()`. Wire new variants here.
- **`components/pages/variant-a/`** — *Use-now planner* (the polished default). Files: `index.tsx` (page, `"use client"`), `data.ts` (destinations + `verdictFor`/`summarize`/`fmt` economics — the **canonical data source**), `world-map.tsx` (canvas dotted world map + clickable pins — **reusable**), `variant-a.css` (base styles, also imported by other variants).
- **`components/pages/variant-b/`** — *Wallet-matched Deal Alerts*. Reuses variant A's `data.ts`, `world-map.tsx`, and `variant-a.css`. Adds `wallet.ts` (wallet/pool/match logic) and `variant-b.css` (layered on top of the base styles, like the original `styles.css` + `styles-alerts.css` split).
- **`components/pages/variant-c.tsx` / `variant-d.tsx`** — placeholders rendering `variant-placeholder.tsx`.

When adding destinations or changing offer economics, edit `components/pages/variant-a/data.ts` — both variants consume it. Reuse `world-map.tsx` and the base `variant-a.css` rather than duplicating them.
