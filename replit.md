# GreenBasket

A full-stack Nigerian boutique commodity shop — mobile-first storefront with cart, wishlist, checkout, orders, and reviews; plus a complete admin dashboard with inventory, orders, customers, suppliers, expenses, staff, promo codes, and reports.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/shop run dev` — run the storefront
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed` — seed the database with demo data
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Wouter (routing) + TanStack Query + shadcn/ui + Tailwind CSS
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → `@workspace/api-client-react`)
- Build: esbuild (CJS bundle)
- Charts: Recharts (admin dashboard & reports)

## Where things live

- `artifacts/shop/` — React storefront (all customer + admin pages)
- `artifacts/api-server/` — Express API backend
- `lib/db/` — Drizzle ORM schema + migrations (`@workspace/db`)
- `lib/api-spec/` — OpenAPI spec + Orval codegen config
- `lib/api-client-react/` — Generated React Query hooks
- `scripts/src/seed.ts` — Database seed script

## Architecture decisions

- Contract-first: OpenAPI spec drives all API types; never write fetch calls by hand.
- JWT in localStorage (key: `greenbasket_token`) — passed via custom Orval fetcher using `setAuthTokenGetter`.
- Admin auth at `/api/auth/admin/login` (role check: owner/manager/staff); customer auth at `/api/auth/login`.
- All workspace packages use `@workspace/` prefix and are resolved by pnpm workspaces.
- Query hook pattern: always pass `queryKey: getXxxQueryKey()` alongside `query` options (required by Orval's strict types).

## Product

- **Customer storefront**: Browse products by category, search, product detail with reviews, add to cart/wishlist, checkout with address & payment method, order history and tracking.
- **Admin dashboard**: KPI overview, product CRUD with image upload and stock adjustment, order management, customer list, supplier management, expense tracking, staff management, promo code CRUD, and revenue/sales reports with charts.

## Demo Credentials

- **Admin**: admin@greenbasket.com / admin123
- **Customer**: amaka@example.com / test1234

## Design

- Primary: `#1a5c34` (dark green)
- Accent: `#c87f0a` (amber)
- Background: `#f5f2ed` (cream)
- Fonts: Playfair Display (headings) + DM Sans (body)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing the OpenAPI spec before editing frontend hooks.
- `pnpm run typecheck` must pass before restarting the shop workflow — Vite will still serve but TS errors catch logic bugs.
- The seed script requires `@workspace/db` as a workspace dependency in `scripts/package.json`.
- Do NOT run `pnpm dev` at the workspace root — use workflows or `pnpm --filter` commands.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- DB schema source of truth: `lib/db/src/schema.ts`
- API contract source of truth: `lib/api-spec/openapi.yaml`
