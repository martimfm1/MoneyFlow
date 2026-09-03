# MoneyFlow

MoneyFlow is an open-source, mobile-first personal finance and wishlist application built to help people understand their money and make better spending decisions.

**Track → Understand → Prioritize → Decide**

MoneyFlow combines everyday money tracking, account management, recurring income and expenses, budgets, goals, wishlist planning and financial insights in one focused interface.

## Project status

**Production-ready foundation / active development**

The application currently includes the core personal-finance workflows, responsive desktop and mobile experiences, Supabase-backed data protection, PWA foundations, recurring income and expense management, planning tools and a unified dark/minimal UI system built with shadcn components.

## Features

### Money management

- Supabase SSR authentication with Next.js App Router
- Guided onboarding with profile, currency and first account
- Multiple financial accounts with balances and active/inactive state
- Income and expense transactions
- Account selection when creating transactions
- Transaction editing, filtering and secure deletion
- Category-based transaction organization
- Automatic account-balance synchronization through PostgreSQL triggers
- Archived-account protection for new transactions
- Locale-aware currency and date formatting

### Recurring income & expenses

- Recurring income management
- Recurring expense management
- Account selection for recurring income and expenses
- Frequency and next-due-date tracking
- Active / paused recurring items
- Editing and secure deletion
- Recurring-cost projections and annualized spending context
- Dedicated navigation between recurring expenses and recurring income

### Planning

- Custom categories with ordering and deletion safeguards
- Monthly budgets by category
- Overspending detection
- Savings and financial-goal tracking
- Goal contributions with server-side validation
- Target-date and priority management
- Wishlist with price, category, priority, status, URL, image URL, desired date and notes
- Wishlist item editing and secure deletion
- Wishlist-to-goal conversion

### Dashboard & insights

- Personal financial overview dashboard
- Total balance across active accounts
- Monthly income, expenses and savings overview
- Recent transactions with account context
- Active goal progress
- Wishlist preview
- Six-month income and expense analytics
- Category spending breakdown
- Decision-oriented financial health indicators
- Responsive desktop layouts with persistent sidebar navigation
- Mobile-first bottom navigation with expandable More menu
- Quick-add flow for faster transaction entry

### UI / UX

- Dark-first visual system with restrained neutral tones
- Minimal, consistent spacing and typography
- shadcn/ui primitives for core interactive components
- Glassmorphism for navigation, overlays and transient UI where appropriate
- Responsive layouts designed mobile-first and expanded for desktop
- Touch-friendly controls and safe-area support on mobile
- Consistent cards, dialogs, popovers, buttons, badges, tables, empty states, skeletons and loading indicators
- Toast notifications positioned at the top of the viewport
- Keyboard-visible focus states and reduced-motion support

### Platform & security

- Next.js 16 + React 19 + TypeScript
- Installable PWA manifest and application icons
- Service-worker static asset caching
- Offline navigation fallback
- Server-side validation with Zod
- Supabase Row Level Security
- Server-side ownership checks across related records
- No service-role credentials exposed to the client
- Protected account and transaction relationships

## Tech stack

- **Framework:** Next.js 16 App Router
- **UI:** React 19, Tailwind CSS 4, shadcn/ui, Base UI
- **Language:** TypeScript
- **Backend & database:** Supabase / PostgreSQL
- **Validation:** Zod
- **Forms:** React Hook Form
- **Charts:** Recharts + shadcn chart primitives
- **Icons:** Lucide React
- **Package manager:** pnpm

## Getting started

### Requirements

- Node.js compatible with the project toolchain
- pnpm
- A Supabase project

### Installation

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`.

### Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Only public Supabase client configuration belongs in these variables. Never commit service-role keys, private credentials or access tokens.

## Supabase

Apply migrations from `supabase/migrations` in ascending order. Migration numbers must never be reused.

The database uses Row Level Security and user ownership checks for user-owned resources. Account relationships are also validated server-side before transactions or recurring records are created or updated.

## Quality

Run the complete local quality pipeline before opening or merging changes:

```bash
pnpm qa
```

The quality pipeline runs:

1. ESLint
2. TypeScript typecheck
3. Next.js production build
4. Formatting checks

CI runs the same production quality workflow on GitHub Actions.

## Architecture

The project is organized around clear application boundaries:

- `app/` — routes, server actions and page-level application logic
- `components/` — reusable UI and feature components
- `components/ui/` — shadcn/ui primitives
- `lib/` — shared formatting, i18n, Supabase and application utilities
- `supabase/migrations/` — database schema and security migrations
- `docs/` — architecture and product documentation

See [`docs/architecture.md`](docs/architecture.md) for information architecture, user flows, database boundaries, UI architecture, design tokens and security principles.

## Contributing

Contributions should preserve the existing product principles: simple financial workflows, strong ownership boundaries, responsive mobile-first UX, accessible interactions and a consistent design system.

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Security

See [`SECURITY.md`](SECURITY.md) for the security baseline and vulnerability-reporting guidance.

## Roadmap

The core product foundation is in place. Future work can focus on deeper automated testing, accessibility verification, performance optimization, richer financial insights and stronger offline form persistence.

## License

MIT. See [`LICENSE`](LICENSE).
