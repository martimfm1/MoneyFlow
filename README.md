# MoneyFlow

MoneyFlow is a mobile-first personal finance and wishlist application designed to answer three questions quickly: **what do I have, what can I spend, and what should I spend it on?**

The product follows **Track → Understand → Prioritize → Decide**. It is intentionally more than an expense tracker.

## Status

MoneyFlow is in active product-quality development. The core money flow, planning tools, recurring-expense simulator, PWA foundations, responsive desktop experience and security baseline are implemented. The next focus is automated testing, deeper accessibility verification, performance work and additional financial insights.

## Features

### Money

- Supabase SSR authentication with Next.js 16
- Guided onboarding with name, currency and first account
- Accounts, balances, editing, archiving and reactivation
- Fast income and expense tracking
- Transaction editing and secure deletion
- Transaction filtering by type/category and description search
- Automatic account-balance synchronization through PostgreSQL triggers
- Protection against transactions on archived accounts
- Locale-aware EUR formatting through shared formatting helpers

### Planning

- Custom categories with create, rename, delete and ordering controls
- Deletion protection for categories containing existing transactions
- Wishlist with price, category, priority, status, URL, image URL, desired date and notes
- Wishlist editing and secure deletion
- Wishlist-to-goal conversion
- Goals with target amount, current amount, priority and target date
- Goal contributions with server validation and target protection
- Monthly budgets by category with overspend detection
- Recurring-expense simulator for domains, subscriptions, hosting and other commitments
- Monthly reserve and annualized cost calculations for recurring expenses
- Next-renewal tracking, due-soon indicators, pause/reactivate and editing

### Dashboard & insights

- Desktop sidebar with progressive mobile navigation
- Five-item mobile navigation with a dedicated More menu
- Current balance overview
- Current-month income, expenses and saved amount
- Transparent financial-health indicator based on recorded cash flow, savings rate and recurring commitments
- Recent transactions
- Active goals
- Responsive desktop layouts for accounts, transactions, budgets, analytics, wishlist and settings
- Six-month income/expense analytics and category spending breakdown

### Platform

- Light, dark and system themes
- Installable PWA manifest and application icon
- Service-worker static-asset caching
- Offline navigation fallback
- Safe-area-aware mobile navigation
- Server-side Zod validation
- Supabase Row Level Security and cross-table ownership checks
- No service-role credentials in client code

## Stack

- Next.js App Router 16
- React 19 + TypeScript
- Tailwind CSS 4
- Supabase + PostgreSQL
- React Hook Form + Zod
- Recharts
- Lucide Icons
- pnpm

## Local development

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Then open `http://localhost:3000`.

## Quality checks

Run the complete local quality pipeline before submitting changes:

```bash
pnpm qa
```

The CI workflow runs linting, typechecking, production build and formatting checks.

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Only public client configuration belongs in these variables. Never commit service-role keys, private credentials or tokens.

## Supabase

Apply the files in `supabase/migrations` in ascending order. Migration numbers must never be reused. User-owned records use Row Level Security and server-side ownership checks.

For the current schema, the recurring-expense simulator is introduced by `0011_recurring_expenses.sql`.

## Product architecture

See [`docs/architecture.md`](docs/architecture.md) for information architecture, user flows, database boundaries, UI architecture, design tokens and security principles.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Security

See [`SECURITY.md`](SECURITY.md) for the security baseline and private vulnerability-reporting guidance.

## Roadmap

1. Automated business-logic and permission tests
2. Deeper accessibility verification and keyboard/screen-reader QA
3. Performance optimization and large-transaction pagination
4. Richer financial comparisons and decision-oriented insights
5. More resilient offline form persistence
6. Public release preparation and screenshot/documentation refresh

## License

MIT. See [`LICENSE`](LICENSE).
