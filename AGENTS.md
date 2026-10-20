<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Frontend Routing & UI Standards (MANDATORY)

## 1. Route Group Structure
All routes inside `frontend/app/` MUST adhere to this exact grouping hierarchy:
- `app/(public)/`: Non-authenticated routes ONLY (e.g. `(public)/(auth)/login`).
- `app/(protected)/`: Authenticated routes:
  - `app/(protected)/(admin)/`: All administrative oversight routes ONLY (e.g., `(admin)/users`, `(admin)/documents`). Guarded strictly for `isAdmin` role.
  - `app/(protected)/(employee)/`: All standard employee domain routes (e.g., `(employee)/my-documents`).
  - `app/(protected)/profile/`: Shared profile view & edit (`profile/page.tsx`), placed directly under `(protected)` because both admin and employee users access their own profile.

## 2. UI Component Library (shadcn UI)
- Use **shadcn UI** primitives (configured in `components/ui/` with Tailwind CSS 4 and `@radix-ui`) instead of rolling custom ad-hoc components.
- Do NOT build custom buttons, dialogs, dropdowns, or forms when a shadcn component exists.

## 3. Reference vs Implementation Authority (STRICT)
- **Legacy `ghcl/` is strictly for reference**: DO NOT copy-paste logic from the legacy `ghcl/` folder. It is incompatible with Express + Next.js.
- **Backend-first contract derivation**: Frontend types, schemas, and validators MUST ALWAYS be derived from the backend API/database contracts. NEVER alter or modify the backend to match frontend assumptions.

## 4. HashiCorp Design Language Uniformity (MANDATORY)
- All components (both adapted legacy components and new non-legacy components) MUST adhere strictly to the HashiCorp `DESIGN.md` pattern:
  - Deep dark canvas (`#090a0c`), surface-1 charcoal lift (`#121316`), and surface-2 lift (`#18191e`).
  - 1px translucent hairlines (`rgba(178, 182, 189, 0.12)`).
  - High-contrast typography: pure white headers and buttons, secondary ink (`#8e939e`), and uppercase tracking-wider eyebrows (`text-[11px] font-semibold uppercase tracking-wider text-muted-foreground`).
  - 8px radii (`rounded-md`).
  - Minimalist UX: Eliminate all verbose, noisy microcopy, conditions banners, and non-essential helper text.
  - New non-legacy components (Admin documents KYC dashboard, single-device conflict modal, reveal switches) must visually and structurally match the legacy components for 100% design uniformity.

## 5. Next.js 16 Network Boundary Convention (`proxy.ts`)
- In **Next.js 16**, the traditional `middleware.ts` file convention is **deprecated** and replaced by **`proxy.ts`**.
- Use `proxy.ts` at the root/src of `frontend/` exporting `export function proxy(request: NextRequest)` for intercepting requests at the network boundary. Do not create new `middleware.ts` files.
