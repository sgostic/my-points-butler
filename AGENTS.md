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
