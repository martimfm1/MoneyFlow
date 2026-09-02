# MoneyFlow

MoneyFlow is a mobile-first personal finance and wishlist application designed to answer three questions quickly: what do I have, what can I spend, and what should I spend it on?

The product follows the flow **Track → Understand → Prioritize → Decide**. It is intentionally not just another expense tracker.

## Status

Phase 4 is in progress. Authentication, PostgreSQL schema/RLS, onboarding, accounts, transactions, categories, transaction filtering/search, wishlist planning, goal contributions, account management, monthly budgets, financial analytics, dark mode and PWA foundations are implemented.

## Implemented

- Supabase SSR authentication with Next.js 16 proxy session refresh
- Sign in / sign up flow
- Guided onboarding with name, currency and first account setup
- User profiles with locale and currency defaults
- Accounts and balances
- Account editing, archiving and reactivation
- Fast income and expense tracking
- Transaction editing and deletion with ownership validation
- Default personal finance categories
- Personal category management
- Category selection on transactions
- Transaction history with type/category filters and description search
- Database trigger to keep account balances synchronized with transactions
- Protection against creating new transactions on archived accounts
- Wishlist with price, priority, notes, target date, URL and status
- Wishlist state management: want, saving, ready and purchased
- Wishlist-to-goal conversion while preserving the item relationship
- Savings goals with priorities and target dates
- Goal detail pages with progress and contribution history
- Goal contributions with automatic progress synchronization
- Database guard preventing goal contributions from exceeding the target, including concurrent writes
- Monthly budgets per category with real expense tracking and month navigation
- Budget status with remaining amount and overspend detection
- Financial analytics with six-month income/expense trends
- Current-period spending breakdown by category
- Transparent net balance and savings-rate calculations
- User-selectable light, dark and system theme with persistence
- Installable PWA manifest and application icon
- Safe service worker caching for static assets with offline navigation fallback
- Offline fallback screen for unavailable pages
- Row Level Security with cross-table ownership checks
- Mobile-first dashboard shell
- Dashboard overview with recent activity and active goal summary
- Reusable button and link-button primitives

## Planned core features

- More advanced financial insights and comparisons
- Portuguese (Portugal) and English localization
- Accessibility, performance and automated tests

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
3. Wishlist, priorities, goals and budgets
4. Analytics, PWA, dark mode and responsive refinements
5. Accessibility, performance, security, tests and UX polish

## License

MIT license planned before the first public release.
