# Implementation Plan: Expense and Budget Visualizer

## Overview

Implement the Expense and Budget Visualizer as a fully client-side static web app (HTML + CSS + Vanilla JS) following the unidirectional data-flow architecture described in the design. All logic lives in a single `app.js` (IIFE pattern), styled by `style.css`, and delivered via `index.html` — no build tools, no frameworks, no server.

## Tasks

- [x] 1. Set up project file structure and HTML skeleton
  - Create `index.html` with semantic HTML: a `<header>` for Balance_Display, a `<main>` containing the Input_Form section, Transaction_List `<ul>`, and a `<canvas>` element for the Chart
  - Add `<link>` to `style.css` and `<script>` tag for `app.js` at the bottom of `<body>`
  - Add `aria-label` to the `<canvas>` element and associate `<label>` elements with every form control for accessibility
  - Create empty `style.css` and `app.js` files in the same directory as `index.html`
  - _Requirements: 7.2, 7.3, 9.3, 9.4_

- [x] 2. Implement the State module
  - [x] 2.1 Implement state initialisation and transition functions inside `app.js` using the IIFE namespace pattern
    - Implement `initState()` returning `{ transactions: [] }`
    - Implement `addTransaction(state, tx)` returning a new state object with `tx` appended to `transactions`
    - Implement `deleteTransaction(state, id)` returning a new state object with the matching entry removed
    - Implement `hydrateState(rawArray)` returning a state object built from a parsed JSON array
    - _Requirements: 1.2, 3.2, 6.3, 6.4_

  - [ ]* 2.2 Write property test for `addTransaction` (Property 4)
    - **Property 4: Adding a valid transaction grows the list by exactly one**
    - **Validates: Requirements 1.2, 2.1**
    - Use fast-check arbitrary generators for valid transactions; assert `newState.transactions.length === original.length + 1` and that the new entry is present

  - [ ]* 2.3 Write property test for `deleteTransaction` (Property 5)
    - **Property 5: Deleting a transaction removes exactly that entry**
    - **Validates: Requirements 3.2, 3.3**
    - Generate a state with ≥ 1 transaction, pick a random id, assert the result has length − 1 and contains no entry with that id

  - [ ]* 2.4 Write property test for ordering stability (Property 8)
    - **Property 8: Transaction list ordering is always ascending by insertion time**
    - **Validates: Requirements 2.1**
    - Generate arbitrary sequences of add/delete operations; assert remaining transactions are strictly ascending by `dateAdded`

- [x] 3. Implement the Storage module
  - [x] 3.1 Implement `saveTransactions(transactions)` and `loadTransactions()` inside the IIFE namespace
    - `saveTransactions` serializes the array to a JSON string and writes to `localStorage` under key `expense_budget_transactions`; wrap in try/catch and surface a user-facing banner on `DOMException` (quota exceeded)
    - `loadTransactions` reads from `localStorage`, parses JSON, and returns the array; on `SyntaxError` or missing key return `[]`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 3.2 Write property test for storage round-trip (Property 1)
    - **Property 1: Storage round-trip preserves transaction data**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.5**
    - Generate arbitrary arrays of valid Transaction objects; assert `JSON.parse(JSON.stringify(txList))` deep-equals the original for all fields (`id`, `name`, `amount`, `category`, `dateAdded`)

- [x] 4. Implement the Validator module
  - [x] 4.1 Implement `validateForm({ name, amount, category })` inside the IIFE namespace
    - Return `{ valid: boolean, errors: { name?, amount?, category? } }`
    - `name`: non-empty after trimming, max 100 characters
    - `amount`: numeric, > 0.00, ≤ 999,999,999.99
    - `category`: one of `['Food', 'Transport', 'Fun']`
    - _Requirements: 1.3, 1.4_

  - [ ]* 4.2 Write property test for whitespace name rejection (Property 2)
    - **Property 2: Validation rejects whitespace-only and empty names**
    - **Validates: Requirements 1.3, 1.4**
    - Generate strings of `\s+` characters only; assert `validateForm({ name, amount: 1, category: 'Food' }).valid === false` and `errors.name` is set

  - [ ]* 4.3 Write property test for out-of-range amount rejection (Property 3)
    - **Property 3: Validation rejects out-of-range amounts**
    - **Validates: Requirements 1.3, 1.4**
    - Generate numbers ≤ 0 or > 999,999,999.99; assert `validateForm({ name: 'x', amount, category: 'Food' }).valid === false` and `errors.amount` is set

- [ ] 5. Checkpoint — core logic verified
  - Ensure all property and unit tests pass for State, Storage, and Validator modules before proceeding.

- [x] 6. Implement the Renderer module
  - [x] 6.1 Implement `renderTransactionList(state)` — rebuild the `<ul>` contents from `state.transactions`
    - Display each transaction's item name, amount formatted as `$X.XX`, and category
    - If a transaction has no category, show a placeholder label "Uncategorized"
    - Include a clearly labelled delete `<button>` per entry with a `data-id` attribute
    - Show the empty-state message when `state.transactions` is empty
    - _Requirements: 2.1, 2.4, 3.1_

  - [x] 6.2 Implement `renderBalanceDisplay(state)` — compute the sum of all amounts and update the balance text node
    - Format as `$X.XX` with exactly two decimal places; show `$0.00` when the list is empty
    - _Requirements: 4.1, 4.4_

  - [x] 6.3 Implement `showFormErrors(errors)` and `clearFormErrors()` — inject and remove inline error messages in the form
    - Each error message targets the corresponding field (name, amount, category)
    - _Requirements: 1.4_

  - [x] 6.4 Implement `resetForm()` — clear item name to empty, amount to empty, category dropdown to unselected placeholder
    - _Requirements: 1.5_

  - [x] 6.5 Implement `renderAll(state)` — call `renderTransactionList`, `renderBalanceDisplay`, and `renderChart` in order
    - _Requirements: 1.2, 3.2, 4.2, 4.3_

  - [ ]* 6.6 Write unit tests for Renderer functions
    - Test `renderBalanceDisplay` shows `$0.00` on empty state and correct total after add/delete
    - Test `renderTransactionList` shows empty-state message when no transactions exist and all entries after hydration
    - _Requirements: 2.4, 4.1, 4.4_

- [x] 7. Implement the Chart module
  - [~] 7.1 Implement `renderChart(state)` using the HTML5 Canvas 2D API
    - Compute per-category totals from `state.transactions`
    - Draw each category as a distinct pie segment sized proportionally to its share of the grand total
    - Assign fixed colours: Food `#FF6384`, Transport `#36A2EB`, Fun `#FFCE56`
    - Draw a category name label adjacent to each visible segment
    - Delegate to `drawEmptyChartMessage(ctx)` when `state.transactions` is empty
    - If Canvas API is unavailable, hide `<canvas>` and show "Chart unavailable in this browser"
    - _Requirements: 5.1, 5.4, 5.5, 9.2_

  - [ ]* 7.2 Write property test for chart segment proportions (Property 7)
    - **Property 7: Chart segment proportions match category totals**
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - Extract the computed segment angles from `renderChart`'s internal calculation; for each category assert `segmentAngle / (2π) ≈ categoryTotal / grandTotal` within floating-point tolerance

- [ ] 8. Checkpoint — rendering verified
  - Ensure all renderer and chart unit/property tests pass before proceeding to event wiring.

- [x] 9. Implement CSS styling
  - [x] 9.1 Implement base layout and typography in `style.css`
    - Set base font size to at least 16px for body text
    - Apply clear visual hierarchy: Balance_Display prominently above Input_Form and Transaction_List
    - _Requirements: 9.1, 9.3_

  - [x] 9.2 Implement responsive layout and scrollable Transaction_List
    - Use CSS to make the Transaction_List container scrollable when entries overflow its visible area
    - Apply responsive layout (flexbox or grid) so all controls and the Chart remain visible and operable from 320px to 1920px viewport width without horizontal scrolling
    - _Requirements: 2.2, 8.3_

  - [x] 9.3 Implement focus indicators and form control styles
    - Provide visible `:focus` / `:focus-visible` outlines on all interactive controls (inputs, dropdowns, buttons)
    - _Requirements: 9.4_

- [x] 10. Implement event wiring and app bootstrap
  - [x] 10.1 Wire up the app entry point in `app.js` on `DOMContentLoaded`
    - Call `loadTransactions()` → `hydrateState()` → `renderAll()` to restore persisted state on load
    - Attach a `submit` event listener to the Input_Form: run `validateForm`, on failure call `showFormErrors`, on success call `addTransaction` → `saveTransactions` → `renderAll` → `clearFormErrors` → `resetForm`
    - Use event delegation on the Transaction_List `<ul>` for delete button clicks: call `deleteTransaction` → `saveTransactions` → `renderAll`
    - Implement UUID generation using `crypto.randomUUID()` with a `Math.random()`-based hex fallback for older browsers
    - _Requirements: 1.2, 1.4, 1.5, 3.2, 3.3, 6.1, 6.2, 6.3, 8.1, 8.2_

  - [ ]* 10.2 Write unit tests for event wiring integration
    - Test that submitting a valid form appends a transaction and resets the form
    - Test that clicking a delete button removes the correct transaction
    - Test that app load restores all previously saved transactions
    - _Requirements: 1.2, 1.5, 3.2, 6.3_

- [x] 11. Implement balance computation with floating-point correctness
  - [x] 11.1 Extract a pure `computeBalance(transactions)` helper function used by `renderBalanceDisplay`
    - Sum all `amount` values and round to exactly two decimal places using `Math.round(sum * 100) / 100` or `toFixed(2)`
    - Return `0.00` for an empty list
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 11.2 Write property test for balance computation (Property 6)
    - **Property 6: Balance equals the arithmetic sum of all transaction amounts**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
    - Generate arbitrary non-empty transaction arrays; assert `computeBalance(txList) === parseFloat((txList.reduce((s, t) => s + t.amount, 0)).toFixed(2))`

- [-] 12. Final checkpoint — full integration verified
  - Ensure all tests pass (unit, property-based).
  - Verify the app opens correctly from the local filesystem via `file://` in Chrome, Firefox, Edge, and Safari with no console errors.
  - Confirm add/delete operations update Transaction_List, Balance_Display, and Chart within the required time budgets.
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; all core tasks must be implemented
- Each task references specific requirements for traceability
- Property tests use the **fast-check** UMD bundle (no npm/bundler needed) loaded via a `<script>` tag in `test.html`
- Tag every property test with `// Feature: expense-budget-visualizer, Property N: <text>` as specified in the design
- All modules share a single IIFE namespace inside `app.js` — no ES Module `import/export` syntax
- The `crypto.randomUUID()` fallback ensures compatibility with browsers that lack the Web Crypto API
- The `$` currency symbol is defined as a single constant at the top of `app.js` for easy modification

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.2", "4.2", "4.3"] },
    { "id": 3, "tasks": ["6.1", "6.2", "6.3", "6.4", "6.5", "7.1", "11.1"] },
    { "id": 4, "tasks": ["6.6", "7.2", "9.1", "9.2", "9.3", "11.2"] },
    { "id": 5, "tasks": ["10.1"] },
    { "id": 6, "tasks": ["10.2"] }
  ]
}
```
