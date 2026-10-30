# Requirements Document

## Introduction

The Expense and Budget Visualizer is a client-side web application built with HTML, CSS, and Vanilla JavaScript. It allows users to track personal expenses by entering transactions with a name, amount, and category. The app displays a running total balance, a scrollable transaction list with delete capability, and a pie chart that visualizes spending distribution by category. All data is persisted in the browser's Local Storage so entries survive page refreshes. The app requires no server, framework, or build tooling.

## Glossary

- **App**: The Expense and Budget Visualizer web application.
- **Transaction**: A single expense record consisting of an item name, a monetary amount, and a category.
- **Input_Form**: The HTML form component through which users enter new transactions.
- **Transaction_List**: The scrollable UI component that displays all recorded transactions.
- **Balance_Display**: The UI component at the top of the page that shows the current total of all transaction amounts.
- **Chart**: The pie chart component that visualizes spending distribution across categories.
- **Storage**: The browser Local Storage API used to persist transaction data client-side.
- **Category**: A classification label for a transaction. Valid values are: Food, Transport, Fun.
- **Validator**: The client-side logic that checks Input_Form fields before a transaction is accepted.

---

## Requirements

### Requirement 1: Transaction Input Form

**User Story:** As a user, I want to enter an item name, amount, and category so that I can record a new expense transaction.

#### Acceptance Criteria

1. THE Input_Form SHALL contain a text field for item name accepting up to 100 characters, a numeric field for amount, and a dropdown selector for category with the options Food, Transport, and Fun.
2. WHEN the user submits the Input_Form with all fields filled and a valid positive amount, THE App SHALL add a new Transaction to the transaction data and update the Transaction_List, Balance_Display, and Chart.
3. WHEN the user submits the Input_Form, THE Validator SHALL verify that the item name field is not empty, the amount field contains a numeric value greater than 0.00 and no greater than 999,999,999.99, and a category has been selected.
4. IF the Validator detects that one or more required fields are empty or invalid, THEN THE Input_Form SHALL display an inline error message identifying which fields require correction and SHALL NOT add a Transaction.
5. WHEN a Transaction is successfully added, THE Input_Form SHALL reset the item name field to empty, the amount field to empty, and the category dropdown to its unselected placeholder state.

---

### Requirement 2: Transaction List Display

**User Story:** As a user, I want to see a scrollable list of all my recorded transactions so that I can review my spending history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display all stored Transactions in ascending order by date and time added (oldest entry first), showing the item name, amount formatted as a number with exactly 2 decimal places preceded by the currency symbol, and category for each entry; if a Transaction has no category assigned, THE Transaction_List SHALL display a placeholder label indicating the category is uncategorized.
2. WHILE the number of Transactions exceeds the visible area of the Transaction_List container, THE Transaction_List SHALL remain scrollable so all entries are accessible.
3. WHEN a Transaction is added or deleted, THE Transaction_List SHALL update to reflect the current state of the transaction data within 300 milliseconds without requiring a page reload.
4. WHEN the Transaction_List contains no Transactions, THE Transaction_List SHALL display an empty-state message indicating that no expenses have been recorded yet.

---

### Requirement 3: Delete Transaction

**User Story:** As a user, I want to delete individual transactions so that I can remove incorrect or unwanted entries.

#### Acceptance Criteria

1. THE Transaction_List SHALL render a clearly labelled delete button for each Transaction entry.
2. WHEN the user activates the delete button for a Transaction, THE App SHALL remove that Transaction from the transaction data and update the Transaction_List, Balance_Display, and Chart within 100 milliseconds.
3. WHEN a Transaction is deleted, THE Storage SHALL update to reflect the removed Transaction so the deletion persists across page reloads.

---

### Requirement 4: Total Balance Display

**User Story:** As a user, I want to see my total spending balance at the top of the page so that I can understand my overall expenditure at a glance.

#### Acceptance Criteria

1. THE Balance_Display SHALL show the sum of all Transaction amounts, formatted as a currency value with a currency symbol and exactly two decimal places, at the top of the page.
2. WHEN a Transaction is added, THE Balance_Display SHALL recalculate and display the updated total within 100 milliseconds.
3. WHEN a Transaction is deleted, THE Balance_Display SHALL recalculate and display the updated total within 100 milliseconds.
4. WHEN the App loads and no Transactions are stored, THE Balance_Display SHALL display a total of zero formatted with the same currency symbol and two decimal places.

---

### Requirement 5: Spending Distribution Chart

**User Story:** As a user, I want to see a pie chart of my spending by category so that I can understand how my expenses are distributed.

#### Acceptance Criteria

1. THE Chart SHALL render as a pie chart displaying each Category as a distinct segment, where each segment's size is proportional to the total amount of Transactions in that Category relative to the overall total.
2. WHEN a Transaction is added, THE Chart SHALL update immediately to reflect the new spending distribution without requiring a page reload.
3. WHEN a Transaction is deleted, THE Chart SHALL update immediately to reflect the revised spending distribution without requiring a page reload.
4. WHEN the App loads with no Transactions, THE Chart SHALL display a text message indicating no spending data is available.
5. THE Chart SHALL display a label for each visible Category segment identifying the Category name.

---

### Requirement 6: Data Persistence via Local Storage

**User Story:** As a user, I want my transactions to be saved locally so that my data is preserved when I close or refresh the browser.

#### Acceptance Criteria

1. WHEN a Transaction is added, THE Storage SHALL serialize and save the complete transaction data to the browser Local Storage immediately.
2. WHEN a Transaction is deleted, THE Storage SHALL serialize and save the updated transaction data to the browser Local Storage immediately.
3. WHEN the App loads, THE App SHALL read transaction data from the Storage and restore the Transaction_List, Balance_Display, and Chart to reflect all previously saved Transactions.
4. IF the Storage contains no transaction data on load, THEN THE App SHALL initialize with an empty transaction list and display zero balance.
5. THE Storage SHALL serialize transaction data as a JSON string so that the round-trip of saving and loading produces a transaction list equivalent to the original (round-trip property).

---

### Requirement 7: Browser Compatibility and Standalone Delivery

**User Story:** As a user, I want the app to work in any modern browser without installation so that I can use it immediately by opening a single file.

#### Acceptance Criteria

1. THE App SHALL function correctly in the current stable versions of Chrome, Firefox, Edge, and Safari without requiring plugins or extensions.
2. THE App SHALL be deliverable as a standalone set of static files (HTML, CSS, JavaScript) that can be opened directly in a browser without a local server.
3. THE App SHALL use only HTML, CSS, and Vanilla JavaScript; THE App SHALL NOT depend on any JavaScript framework or server-side runtime.

---

### Requirement 8: Performance and Responsiveness

**User Story:** As a user, I want the app to respond instantly to my interactions so that tracking expenses feels effortless.

#### Acceptance Criteria

1. WHEN the App is opened in a modern browser on a standard consumer device, THE App SHALL complete its initial render within 2 seconds on a local file load.
2. WHEN the user adds or deletes a Transaction, THE App SHALL update the Transaction_List, Balance_Display, and Chart within 100 milliseconds.
3. THE App SHALL remain usable on viewport widths from 320px to 1920px by adapting its layout so that all controls and the Chart remain visible and operable without horizontal scrolling.

---

### Requirement 9: Visual Design and Usability

**User Story:** As a user, I want a clean, readable interface so that I can use the app without confusion or visual fatigue.

#### Acceptance Criteria

1. THE App SHALL apply a consistent typographic scale with a base font size of at least 16px for body text so that content is readable without zooming.
2. THE App SHALL use distinct, high-contrast colors for each Category segment in the Chart so that segments are visually distinguishable from one another.
3. THE App SHALL present a clear visual hierarchy by placing the Balance_Display prominently above the Input_Form and Transaction_List.
4. THE Input_Form SHALL provide visible focus indicators on interactive controls to support keyboard navigation.
