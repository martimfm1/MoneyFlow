# MoneyFlow Design System

## Product principles

MoneyFlow should make the user's next useful financial action obvious without making the interface feel like an accounting tool. The experience follows:

**Track → Understand → Prioritize → Decide**

Design choices should support these principles:

1. **Clarity before decoration.** Show the most important number, its period and its context before secondary detail.
2. **One primary action per view.** Keep secondary actions available, but do not give every card the same visual weight.
3. **Progressive disclosure.** Keep common actions visible and move advanced options into clearly named sections or dialogs.
4. **Consistency across the product.** Reuse shared components, labels, status language, spacing and interaction patterns.
5. **Trust through transparency.** Distinguish recorded transactions from projections, estimates, recurring commitments and planned savings.
6. **Calm by default.** Use neutral surfaces and restrained accents. Do not use glass, gradients, shadows or motion to communicate meaning.

## Visual foundations

### Colour

Use the semantic tokens in `app/globals.css` rather than introducing feature-specific colour values:

- `background`, `foreground`: application canvas and primary text
- `surface`, `surface-muted`, `border`: content hierarchy
- `primary`: the main action and selected state
- `success`, `danger`, `warning`, `info`: semantic status and financial movement
- `muted-foreground`: secondary content
- `chart-1` through `chart-5`: data visualisation only

Positive and negative values must also include a sign, label or icon. Never rely on colour alone to communicate income, expenses, risk or completion.

The light theme must use darker semantic accent colours for text and controls. A colour that works as a bright accent on a dark surface is not automatically suitable for text on a light surface.

### Type and density

- Use a clear heading hierarchy and sentence-case labels.
- Use tabular numerals for financial amounts and aligned comparisons.
- Keep secondary labels readable; avoid using tiny all-caps text for essential information.
- Keep line length controlled for explanatory copy.
- Prefer stable spacing and alignment over adding more cards.

### Surfaces

Use flat, legible surfaces as the default. Reserve glass effects for navigation and temporary overlays. Cards should group related information, not wrap every individual value in another border.

## Information hierarchy

### Dashboard

1. Current balance and the currency being displayed.
2. Current-period income, expenses and net movement.
3. Accounts and recent activity.
4. Goals and wishlist context.
5. Secondary analysis and settings.

Always label the time period used by a financial total. Never mix account balances with monthly cash flow or planned recurring costs.

### Feature pages

Each page should have a predictable sequence:

1. Page title and one sentence explaining its purpose.
2. One primary action, when the user can create or change something.
3. A concise summary only when it helps the task.
4. Search and filters near the content they affect.
5. Results with clear empty, loading and error states.

Do not show summary cards that merely repeat information immediately below them.

## Interaction patterns

### Navigation

- Preserve the same mental model on mobile and desktop.
- Show the current destination with both visual styling and `aria-current="page"`.
- Treat mobile menus and quick actions as modal dialogs, including focus management, Escape handling and focus restoration.
- Keep navigation labels visible and readable; do not make icon-only navigation the default.

### Forms

- Every field needs a programmatic label; visible labels are preferred.
- Place instructions beside the field they explain.
- Keep optional and advanced fields secondary.
- Use appropriate input types and input modes, especially for amounts and dates.
- Preserve entered values after recoverable validation errors.
- Put errors next to the field and expose submission feedback through a status or alert region.
- Avoid autofocus on mobile unless it is essential to the task.

### Destructive and irreversible actions

- Use clear verbs such as “Eliminar” or “Arquivar”.
- Explain the consequence before asking for confirmation.
- Make the safe action easy to choose and do not style destructive actions as the default.

### Feedback and states

Every asynchronous or data-driven view should have:

- A loading state that preserves the page structure.
- An empty state that explains what is missing and gives one useful next action.
- An error state with a human-readable explanation and a safe retry path where possible.
- A success confirmation for meaningful changes.

## Accessibility baseline

MoneyFlow targets WCAG 2.2 AA as an engineering baseline. This document is a design contract, not a claim that every route has passed a formal audit.

- Normal text should reach a contrast ratio of at least 4.5:1; large text and meaningful UI graphics should reach at least 3:1.
- Meet the WCAG 2.2 minimum target size of 24 × 24 CSS pixels or its spacing exceptions. Aim for at least 44 × 44 CSS pixels for primary touch controls.
- All functionality must work with a keyboard. Focus must remain visible and follow a logical order.
- Dialogs must announce a title, contain focus while open, close with Escape and return focus to the trigger.
- Forms must have labels, instructions and associated error messages.
- Charts need a concise text summary and an accessible way to inspect the underlying values.
- Do not communicate meaning through colour, position, sound or motion alone.
- Respect reduced-motion, increased-contrast, forced-colour and reduced-transparency preferences.
- Support reflow at narrow widths and text resizing to 200% without loss of content or functionality.
- Keep page language accurate and keep locale-specific formats consistent.

## Responsive behaviour

### Mobile

- Prioritise a single-column reading order.
- Use large touch targets and enough separation between adjacent actions.
- Avoid horizontal page scrolling. Horizontal scrolling is acceptable only for clearly signposted, non-essential carousels or genuinely tabular data.
- Keep floating actions above navigation and safe-area insets.
- Avoid hiding essential information inside hover states or desktop-only interactions.

### Desktop

- Use available width for comparison and context, not for enlarging every card.
- Keep line lengths and form widths controlled.
- Keep the same labels and interaction behaviour as mobile.

## Release review

Before a release, review at minimum:

- 320px, 375px, 768px, 1024px and wide desktop layouts.
- Keyboard-only operation, visible focus, Escape and focus restoration in dialogs.
- Screen-reader names for icon buttons and meaningful status announcements.
- Contrast in both dark and light themes.
- 200% zoom and reduced-motion / forced-colour preferences.
- Empty, populated, loading, error and long-content states.
- Portuguese and English labels, dates, number formats and currencies.
- Financial values with large amounts, negative values and long account/category names.

Automated linting and typechecking are necessary, but they do not replace manual accessibility and usability review.
