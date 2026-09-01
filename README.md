# MoneyFlow

MoneyFlow is a mobile-first personal finance and wishlist application designed to answer three questions quickly: what do I have, what can I spend, and what should I spend it on?

The product follows the flow **Track → Understand → Prioritize → Decide**. It is intentionally not just another expense tracker.

## Status

Phase 1 is in progress. Authentication, the initial PostgreSQL schema/RLS layer, account creation, transaction creation and the first authenticated dashboard are implemented.

## Implemented

- Supabase SSR authentication with Next.js 16 proxy session refresh
- Sign in / sign up flow
- User profiles with locale and currency defaults
- Accounts and balances
- Fast income and expense tracking
- Database trigger to keep account balances synchronized with transactions
- Savings goals data model and goal creation
- Row Level Security with cross-table ownership checks
- Mobile-first dashboard shell
- Reusable button and link-button primitives

## Planned core features

- Onboarding flow with currency/account setup
- Categories and category management
- Transaction history and filtering
- Budgets and financial overview
- Goals and contribution history
- Wishlist with priorities
- Financial insights with transparent calculations
- Portuguese (Portugal) and English localization
- Light and dark mode
- PWA support

## Stack

- Next.js App Router 16
- React + TypeScript
- Tailwind CSS 4
- Supabase + PostgreSQL
- React Hook Form + Zod
- Recharts
- Lucide Icons

## Local development

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Then open `http://localhost:3000`.

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Never commit service-role keys or private credentials.

## Supabase

Apply migrations in `supabase/migrations` to the project in order. Authentication is handled through Supabase Auth and user-owned data is protected by PostgreSQL Row Level Security.

## Product architecture

See [`docs/architecture.md`](docs/architecture.md) for the information architecture, user flows, database direction, component boundaries and delivery phases.

## Roadmap

1. Foundation: auth, design system, Supabase clients, schema and RLS
2. Onboarding, accounts, transactions and dashboard
3. Wishlist, priorities and goals
4. Analytics, PWA, dark mode and responsive refinements
5. Accessibility, performance, security, tests and UX polish

## License

MIT license planned before the first public release.
