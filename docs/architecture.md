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

The More menu contains Accounts, Budgets, Analytics, Recurring, Categories and Settings. It is presented as an accessible modal sheet and must retain keyboard and focus behaviour. The dominant creation action remains accessible without forcing users into deep navigation.

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

### Recurring income and expenses

1. Open the Recurring area and choose the Entries or Exits tab.
2. Create a recurring item with a user-defined name and optional category/source label.
3. Enter amount, account, frequency and next expected date.
4. Review monthly and yearly projections.
5. Pause, edit or delete the commitment as needed.

Suggested labels are convenience only; labels remain free text so the user can record items such as allowance, gifts, small jobs, subscriptions, mobile plans or any other recurring entry or cost. Recurring records are planning data and do not create actual transactions or alter account balances by themselves.

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
- Do not aggregate balances or movements from different currencies without an explicit exchange-rate conversion and timestamp. When conversion is unavailable, group totals by currency or restrict each total to one currency and state that scope.
- Destructive category operations must protect or explicitly reassign related records.
- Goal contribution mutations must be transactional where multiple balances are affected.
- Recurring expenses are planning records, not transactions.

## Dashboard model

The dashboard shows the current account balance separately from planning commitments. Monthly overview values are derived from actual transactions for the current month. The financial-health indicator is explicitly formula-based:

- up to 40 points for positive monthly cash flow
- up to 30 points for the recorded savings rate
- up to 30 points for the relative weight of active recurring commitments

The score is an informational product indicator, not financial advice. When there is no recorded income for the current month, show that there is insufficient data instead of presenting a zero score.

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

Domain components should compose primitives rather than duplicate their behaviour. Shared primitive changes should be preferred to page-specific patches when the same interaction appears in multiple routes.

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

### Design and accessibility contract

See [`docs/design-system.md`](design-system.md) for visual hierarchy, navigation and form patterns, responsive behaviour and the WCAG 2.2 AA engineering baseline. New UI should use semantic design tokens and shared primitives rather than introducing one-off styles.

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

- `public/manifest.webmanifest` defines standalone installation metadata and the app launch route.
- The root layout exposes install metadata for Chromium-based browsers and iOS Home Screen apps.
- `components/pwa/register-sw.tsx` registers the service worker, exposes install guidance and offers a safe update action.
- `public/sw.js` precaches the offline page and manifest, then caches versioned static assets.
- Navigation failures fall back to `/offline`.
- Authenticated financial pages, API responses, balances and transactions are never written to Cache Storage.
- Offline transaction creation and synchronization are not supported; the app returns to the network before loading financial data.

## Security baseline

- Supabase RLS on every user-owned table
- Long-lived browser auth cookies to preserve the session across app launches; users can always explicitly sign out and session revocation still applies
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
