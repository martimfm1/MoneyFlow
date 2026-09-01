# MoneyFlow

MoneyFlow is a mobile-first personal finance and wishlist application designed to answer three questions quickly: what do I have, what can I spend, and what should I spend it on?

The product follows the flow **Track → Understand → Prioritize → Decide**. It is intentionally not just another expense tracker.

## Status

Early foundation. The repository is being built iteratively, with architecture, security and UX decisions established before feature expansion.

## Planned core features

- Accounts and balances
- Fast income and expense tracking
- Budgets and financial overview
- Savings goals and contributions
- Wishlist with priorities
- Financial insights with transparent calculations
- Portuguese (Portugal) and English localization
- Light and dark mode
- PWA support

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- shadcn/ui
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

## Product architecture

See [`docs/architecture.md`](docs/architecture.md) for the initial information architecture, user flows, database direction, component boundaries and delivery phases.

## Roadmap

1. Foundation: auth, design system, Supabase clients, schema and RLS
2. Onboarding, accounts, transactions and dashboard
3. Wishlist, priorities and goals
4. Analytics, PWA, dark mode and responsive refinements
5. Accessibility, performance, security, tests and UX polish

## License

MIT license planned before the first public release.
