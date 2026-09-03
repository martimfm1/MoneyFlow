# MoneyFlow Architecture

## Product goal

MoneyFlow should make a user's financial position understandable within seconds and make the next useful action obvious. The product flow is:

**Track → Understand → Prioritize → Decide**

## Information architecture

### Primary mobile navigation

1. Home
2. Goals
3. Wishlist
4. Transactions
5. More

The More menu contains Accounts, Budgets, Analytics, Recurring, Categories and Settings. The dominant creation action remains accessible without forcing users into deep navigation.

### Desktop

Desktop progressively enhances the same information architecture with a persistent sidebar. Desktop-specific density must not leak back into the mobile experience.

## Main user flows

### First use

1. Create account / sign in
2. Choose currency
3. Create first financial account
4. Enter current balance
5. Optionally create a savings goal
6. Arrive at a guided dashboard

### Add expense

1. Open primary add action
2. Choose Expense
3. Enter amount
4. Select category
5. Select account
6. Save

Description, notes, recurrence and attachments remain secondary options.

### Wishlist to goal

1. Add wishlist item
2. Set price and priority
3. Optionally convert/start saving for item
4. Create linked savings goal
5. Add contributions over time
6. Mark item ready or purchased when appropriate

### Recurring costs

1. Add domain/subscription/hosting expense
2. Enter amount and frequency
3. Set next renewal date
4. Review monthly reserve and annualized cost
5. Pause, edit or delete the commitment as needed

The recurring simulator is designed to turn irregular annual or quarterly invoices into predictable monthly planning values. It does not represent money that has actually been paid unless a real transaction is recorded separately.

## Database direction

All user-owned records require `user_id` ownership and Row Level Security.

Core tables:

- `profiles`
- `accounts`
- `categories`
- `transactions`
- `wishlist_items`
- `goals`
- `goal_contributions`
- `recurring_expenses`

Important principles:

- Never trust a user ID supplied by the client.
- Resolve identity from the authenticated Supabase session.
- Validate mutations server-side with Zod.
- Financial values should use exact numeric/decimal database types rather than floating point.
- Destructive category operations must protect or explicitly reassign related records.
- Goal contribution mutations must be transactional where multiple balances are affected.
- Recurring expenses are planning records, not transactions.

## Dashboard model

The dashboard shows the current account balance separately from planning commitments. Monthly overview values are derived from actual transactions for the current month. The financial-health indicator is explicitly formula-based:

- up to 40 points for positive monthly cash flow
- up to 30 points for the recorded savings rate
- up to 30 points for the relative weight of active recurring commitments

The score is an informational product indicator, not financial advice. When there is no recorded income, the score is 0 because the product has insufficient data for the calculation.

## UI architecture

### Primitives

- Button
- IconButton
- Card
- FormField
- CurrencyInput
- DatePicker
- SearchInput
- Tabs
- ProgressBar
- Modal
- BottomSheet
- ConfirmationDialog

### Domain components

- MoneyDisplay
- BalanceCard
- AccountCard
- TransactionItem
- CategoryBadge
- PriorityBadge
- GoalProgress
- WishlistItem
- ChartCard
- EmptyState
- LoadingState
- ErrorState

Domain components should compose primitives rather than duplicate their behavior.

## Design tokens

The first token layer lives in `app/globals.css` and uses semantic variables rather than feature-specific hard-coded colours.

Current token groups:

- background / foreground
- surface / muted surface
- border
- muted foreground
- primary / primary foreground
- success / danger / warning / info
- small / medium / large radii

Spacing should rely on a restrained Tailwind scale. Touch controls should generally reach at least 44px.

## Server/client boundaries

Default to Server Components.

Use Client Components only for:

- form state
- optimistic interactions
- dialogs and bottom sheets
- interactive charts
- local UI state
- browser-only PWA APIs

Data access and authorization stay server-side wherever possible.

## PWA and offline

- `public/manifest.webmanifest` defines standalone installation metadata.
- `public/icon.svg` is the application icon.
- `public/sw.js` caches the offline shell and static application assets.
- Navigation failures fall back to `/offline`.
- The app does not claim full offline transaction persistence; future work may add IndexedDB-backed drafts/queueing.

## Security baseline

- Supabase RLS on every user-owned table
- No service-role key in browser code
- Server-side authorization on mutations
- Zod validation at trust boundaries
- Environment variables for credentials
- No client-selected ownership fields
- Human-safe UI errors; technical details only in server logs

## Delivery phases

### Phase 1 — Foundation

Architecture, tokens, project scaffold, Supabase clients, auth, schema, RLS and reusable primitives.

### Phase 2 — Core money flow

Onboarding, accounts, transactions and dashboard.

### Phase 3 — Planning

Wishlist, priorities, goals, goal contributions, budgets and recurring expense planning.

### Phase 4 — Product depth

Analytics, PWA, dark mode and responsive refinements.

### Phase 5 — Quality

Accessibility verification, performance optimization, automated tests, edge cases and UX polish.
