/**
 * Expense and Budget Visualizer
 * Single-file application using IIFE namespace pattern.
 * No ES modules — compatible with file:// protocol.
 */
(function (App) {
    'use strict';

    // ─── Constants ────────────────────────────────────────────────────────────
    var CURRENCY_SYMBOL = '$';
    var STORAGE_KEY = 'expense_budget_transactions';
    var VALID_CATEGORIES = ['Food', 'Transport', 'Fun'];
    var CHART_COLOURS = {
        Food:      '#FF6384',
        Transport: '#36A2EB',
        Fun:       '#FFCE56'
    };

    // ─── State Module ─────────────────────────────────────────────────────────

    /**
     * Returns the initial empty application state.
     * @returns {{ transactions: Transaction[] }}
     */
    function initState() {
        return { transactions: [] };
    }

    /**
     * Returns a new state with the given transaction appended.
     * Does NOT mutate the incoming state.
     * @param {{ transactions: Transaction[] }} state
     * @param {Transaction} tx
     * @returns {{ transactions: Transaction[] }}
     */
    function addTransaction(state, tx) {
        return { transactions: state.transactions.concat([tx]) };
    }

    /**
     * Returns a new state with the transaction matching `id` removed.
     * Does NOT mutate the incoming state.
     * @param {{ transactions: Transaction[] }} state
     * @param {string} id
     * @returns {{ transactions: Transaction[] }}
     */
    function deleteTransaction(state, id) {
        return { transactions: state.transactions.filter(function (tx) { return tx.id !== id; }) };
    }

    /**
     * Builds a state object from a raw parsed JSON array (used when hydrating from storage).
     * @param {Transaction[]} rawArray
     * @returns {{ transactions: Transaction[] }}
     */
    function hydrateState(rawArray) {
        return { transactions: rawArray };
    }

    // Expose State functions on the App namespace
    App.initState = initState;
    App.addTransaction = addTransaction;
    App.deleteTransaction = deleteTransaction;
    App.hydrateState = hydrateState;

    // ─── Storage Module ───────────────────────────────────────────────────────

    /**
     * Shows a non-blocking error banner when storage quota is exceeded.
     * Uses #storage-error-banner if it exists in the DOM; otherwise creates one.
     * @param {string} message
     */
    function showStorageErrorBanner(message) {
        var banner = document.getElementById('storage-error-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'storage-error-banner';
            banner.style.cssText = [
                'position:fixed',
                'top:0',
                'left:0',
                'width:100%',
                'padding:10px 16px',
                'background:#c0392b',
                'color:#fff',
                'font-size:14px',
                'z-index:9999',
                'display:flex',
                'align-items:center',
                'justify-content:space-between',
                'box-sizing:border-box'
            ].join(';');
            document.body.appendChild(banner);
        }

        var closeBtn = document.createElement('button');
        closeBtn.textContent = '\u00D7'; // ×
        closeBtn.setAttribute('aria-label', 'Dismiss');
        closeBtn.style.cssText = [
            'background:none',
            'border:none',
            'color:#fff',
            'font-size:18px',
            'cursor:pointer',
            'padding:0 0 0 12px',
            'line-height:1'
        ].join(';');
        closeBtn.addEventListener('click', function () {
            banner.style.display = 'none';
        });

        banner.textContent = message;
        banner.appendChild(closeBtn);
        banner.style.display = 'flex';

        // Auto-hide after 5 seconds
        setTimeout(function () {
            banner.style.display = 'none';
        }, 5000);
    }

    /**
     * Serializes the transactions array to JSON and writes it to localStorage.
     * On DOMException (quota exceeded), displays a user-facing error banner.
     * @param {Transaction[]} transactions
     */
    function saveTransactions(transactions) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
        } catch (err) {
            if (err instanceof DOMException) {
                showStorageErrorBanner('Unable to save \u2014 storage is full.');
            } else {
                throw err;
            }
        }
    }

    /**
     * Reads the transactions array from localStorage and returns it.
     * Returns an empty array if the key is missing or the JSON is malformed.
     * @returns {Transaction[]}
     */
    function loadTransactions() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw === null) {
                return [];
            }
            return JSON.parse(raw);
        } catch (err) {
            return [];
        }
    }

    // Expose Storage functions on the App namespace
    App.saveTransactions = saveTransactions;
    App.loadTransactions = loadTransactions;

    // ─── Validator Module ─────────────────────────────────────────────────────

    /**
     * Validates the Input_Form fields before a transaction is accepted.
     * Pure function — no DOM side-effects.
     *
     * Validation rules:
     *   name     – non-empty after trimming, max 100 characters
     *   amount   – numeric, > 0.00, ≤ 999,999,999.99
     *   category – one of VALID_CATEGORIES
     *
     * @param {{ name: string, amount: string|number, category: string }} fields
     * @returns {{ valid: boolean, errors: { name?: string, amount?: string, category?: string } }}
     */
    function validateForm(fields) {
        var errors = {};

        // ── name validation ────────────────────────────────────────────────
        var trimmedName = (typeof fields.name === 'string') ? fields.name.trim() : '';
        if (trimmedName.length === 0) {
            errors.name = 'Item name is required.';
        } else if (trimmedName.length > 100) {
            errors.name = 'Item name must be 100 characters or fewer.';
        }

        // ── amount validation ──────────────────────────────────────────────
        var rawAmount = fields.amount;
        var numAmount = (typeof rawAmount === 'number') ? rawAmount : parseFloat(rawAmount);
        if (rawAmount === '' || rawAmount === null || rawAmount === undefined || isNaN(numAmount)) {
            errors.amount = 'Amount must be a valid number.';
        } else if (numAmount <= 0) {
            errors.amount = 'Amount must be greater than 0.00.';
        } else if (numAmount > 999999999.99) {
            errors.amount = 'Amount must not exceed 999,999,999.99.';
        }

        // ── category validation ────────────────────────────────────────────
        if (!fields.category || VALID_CATEGORIES.indexOf(fields.category) === -1) {
            errors.category = 'Please select a valid category (Food, Transport, or Fun).';
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors: errors
        };
    }

    // Expose Validator function on the App namespace
    App.validateForm = validateForm;

    // ─── Renderer Module ──────────────────────────────────────────────────────

    /**
     * Rebuilds the contents of the Transaction_List <ul> from state.transactions.
     *
     * Each entry shows:
     *   - item name
     *   - amount formatted as $X.XX
     *   - category (or "Uncategorized" when absent)
     *   - a delete <button> with a data-id attribute set to the transaction's id
     *
     * When the list is empty, shows the .empty-state <li> message node.
     * Transactions are displayed in ascending order by dateAdded (oldest first).
     *
     * @param {{ transactions: Transaction[] }} state
     */
    function renderTransactionList(state) {
        var ul = document.getElementById('transaction-list');
        if (!ul) { return; }

        // Clear current contents
        ul.innerHTML = '';

        var transactions = state.transactions;

        // Show empty-state message when there are no transactions
        if (!transactions || transactions.length === 0) {
            var emptyItem = document.createElement('li');
            emptyItem.className = 'empty-state';
            emptyItem.textContent = 'No expenses have been recorded yet.';
            ul.appendChild(emptyItem);
            return;
        }

        // Sort ascending by dateAdded (oldest first) — defensive copy to avoid mutating state
        var sorted = transactions.slice().sort(function (a, b) {
            return new Date(a.dateAdded) - new Date(b.dateAdded);
        });

        sorted.forEach(function (tx) {
            var category = tx.category && VALID_CATEGORIES.indexOf(tx.category) !== -1
                ? tx.category
                : 'Uncategorized';

            var formattedAmount = CURRENCY_SYMBOL + parseFloat(tx.amount).toFixed(2);

            // Build the list item
            var li = document.createElement('li');
            li.className = 'transaction-item';
            li.setAttribute('data-id', tx.id);

            // Transaction details wrapper
            var details = document.createElement('div');
            details.className = 'transaction-details';

            var nameSpan = document.createElement('span');
            nameSpan.className = 'transaction-name';
            nameSpan.textContent = tx.name;

            var amountSpan = document.createElement('span');
            amountSpan.className = 'transaction-amount';
            amountSpan.textContent = formattedAmount;

            var categorySpan = document.createElement('span');
            categorySpan.className = 'transaction-category';
            categorySpan.textContent = category;

            details.appendChild(nameSpan);
            details.appendChild(amountSpan);
            details.appendChild(categorySpan);

            // Delete button
            var deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-delete';
            deleteBtn.setAttribute('data-id', tx.id);
            deleteBtn.setAttribute('aria-label', 'Delete transaction: ' + tx.name);
            deleteBtn.textContent = 'Delete';

            li.appendChild(details);
            li.appendChild(deleteBtn);
            ul.appendChild(li);
        });
    }

    /**
     * Pure helper — computes the total balance from an array of transactions.
     *
     * - Sums every tx.amount value (coerced to float)
     * - Rounds the result to exactly 2 decimal places using
     *   Math.round(sum * 100) / 100 to avoid floating-point drift
     * - Returns 0.00 (as a number) when the array is empty or falsy
     *
     * Requirements: 4.1, 4.2, 4.3, 4.4
     *
     * @param {Transaction[]} transactions
     * @returns {number} The sum rounded to 2 decimal places (e.g. 12.34)
     */
    function computeBalance(transactions) {
        if (!transactions || transactions.length === 0) {
            return 0.00;
        }
        var sum = transactions.reduce(function (acc, tx) {
            return acc + parseFloat(tx.amount);
        }, 0);
        return Math.round(sum * 100) / 100;
    }

    /**
     * Formats the result of computeBalance and updates the balance
     * display element (#balance-value) in the DOM.
     *
     * - Delegates all arithmetic to computeBalance(state.transactions)
     * - Displays as $X.XX (using CURRENCY_SYMBOL)
     * - Shows $0.00 when the transactions list is empty
     *
     * Requirements: 4.1, 4.4
     *
     * @param {{ transactions: Transaction[] }} state
     */
    function renderBalanceDisplay(state) {
        var el = document.getElementById('balance-value');
        if (!el) { return; }

        var balance = computeBalance(state.transactions);
        el.textContent = CURRENCY_SYMBOL + balance.toFixed(2);
    }

    /**
     * Injects inline error messages into the form for each field that has an error.
     * Clears any previously shown errors first (calls clearFormErrors internally).
     *
     * The HTML already contains empty <span id="name-error">, <span id="amount-error">,
     * and <span id="category-error"> placeholder elements adjacent to each field.
     * This function populates those spans with the error text and makes them visible.
     *
     * Each error span is also linked to its field via aria-describedby on the input,
     * set here dynamically so screen readers announce the error alongside the field.
     *
     * @param {{ name?: string, amount?: string, category?: string }} errors
     */
    function showFormErrors(errors) {
        // Clear stale errors before injecting fresh ones
        clearFormErrors();

        var fieldMap = {
            name:     { inputId: 'item-name',     errorId: 'name-error'     },
            amount:   { inputId: 'item-amount',   errorId: 'amount-error'   },
            category: { inputId: 'item-category', errorId: 'category-error' }
        };

        Object.keys(errors).forEach(function (field) {
            var message = errors[field];
            if (!message) { return; }

            var mapping = fieldMap[field];
            if (!mapping) { return; }

            var errorSpan = document.getElementById(mapping.errorId);
            var inputEl   = document.getElementById(mapping.inputId);

            if (errorSpan) {
                errorSpan.textContent = message;
                errorSpan.classList.add('error-message--visible');
                // role="alert" makes the span a live region so screen readers announce it
                errorSpan.setAttribute('role', 'alert');
            }

            // Associate the error span with the field so screen readers link them
            if (inputEl) {
                inputEl.setAttribute('aria-describedby', mapping.errorId);
                inputEl.setAttribute('aria-invalid', 'true');
            }
        });
    }

    /**
     * Removes all currently displayed inline error messages from the form.
     * Clears text content of every error span and removes the visible class.
     * Also removes aria-invalid and aria-describedby from the input fields
     * so the form returns to a clean state for screen readers.
     */
    function clearFormErrors() {
        var fieldMap = {
            name:     { inputId: 'item-name',     errorId: 'name-error'     },
            amount:   { inputId: 'item-amount',   errorId: 'amount-error'   },
            category: { inputId: 'item-category', errorId: 'category-error' }
        };

        Object.keys(fieldMap).forEach(function (field) {
            var mapping = fieldMap[field];

            var errorSpan = document.getElementById(mapping.errorId);
            var inputEl   = document.getElementById(mapping.inputId);

            if (errorSpan) {
                errorSpan.textContent = '';
                errorSpan.classList.remove('error-message--visible');
                errorSpan.removeAttribute('role');
            }

            if (inputEl) {
                inputEl.removeAttribute('aria-describedby');
                inputEl.removeAttribute('aria-invalid');
            }
        });
    }

    /**
     * Resets the Input_Form to its initial blank state:
     * - item name field cleared
     * - amount field cleared
     * - category dropdown reset to the unselected placeholder
     *
     * Requirements: 1.5
     */
    function resetForm() {
        var form = document.getElementById('transaction-form');
        if (form) {
            form.reset();
        }
    }

    /**
     * Calls all render functions in order to bring the entire UI in sync with state.
     * This is the single render entry point used after every state mutation.
     *
     * Guard: renderChart may not be defined yet if the Chart module (task 7.1) has not
     * been loaded. The typeof check prevents a ReferenceError in that scenario.
     *
     * Requirements: 1.2, 3.2, 4.2, 4.3
     *
     * @param {{ transactions: Transaction[] }} state
     */
    function renderAll(state) {
        renderTransactionList(state);
        renderBalanceDisplay(state);
        // renderChart is defined by the Chart module (task 7.1).
        // Guard against it being absent so renderAll works before that task is complete.
        if (typeof renderChart === 'function') {
            renderChart(state);
        }
    }

    // Expose Renderer functions on the App namespace
    App.computeBalance = computeBalance;
    App.renderTransactionList = renderTransactionList;
    App.renderBalanceDisplay = renderBalanceDisplay;
    App.showFormErrors = showFormErrors;
    App.clearFormErrors = clearFormErrors;
    App.resetForm = resetForm;
    App.renderAll = renderAll;

    // ─── Chart Module ─────────────────────────────────────────────────────────

    /**
     * Draws a centred "no data" message on the canvas.
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} width
     * @param {number} height
     */
    function drawEmptyChartMessage(ctx, width, height) {
        ctx.clearRect(0, 0, width, height);
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#999';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No spending data available', width / 2, height / 2);
    }

    /**
     * Renders a pie chart of spending per category onto the #spending-chart canvas.
     *
     * Segments are drawn proportionally to each category's total relative to the
     * grand total.  Colours come from CHART_COLOURS.  Labels are placed just
     * outside each slice at the arc midpoint.
     *
     * Falls back gracefully when:
     *   - state.transactions is empty  → draws "No spending data available"
     *   - canvas.getContext unavailable → hides canvas, shows #chart-unavailable
     *
     * Stores computed segment data on canvas._chartSegments for property testing.
     *
     * Requirements: 5.1, 5.4, 5.5, 9.2
     *
     * @param {{ transactions: Transaction[] }} state
     */
    function renderChart(state) {
        var canvas = document.getElementById('spending-chart');
        if (!canvas) { return; }

        // ── Canvas API availability check ──────────────────────────────────
        if (typeof canvas.getContext !== 'function') {
            canvas.style.display = 'none';
            var unavailableEl = document.getElementById('chart-unavailable');
            if (unavailableEl) {
                unavailableEl.style.display = '';
            }
            return;
        }

        var ctx = canvas.getContext('2d');
        var width  = canvas.width;
        var height = canvas.height;

        // Clear previous frame
        ctx.clearRect(0, 0, width, height);

        // ── Empty-state guard ─────────────────────────────────────────────
        if (!state.transactions || state.transactions.length === 0) {
            drawEmptyChartMessage(ctx, width, height);
            return;
        }

        // ── Compute per-category totals ───────────────────────────────────
        var totals = {};
        VALID_CATEGORIES.forEach(function (cat) { totals[cat] = 0; });

        state.transactions.forEach(function (tx) {
            if (totals.hasOwnProperty(tx.category)) {
                totals[tx.category] += parseFloat(tx.amount) || 0;
            }
        });

        var grandTotal = VALID_CATEGORIES.reduce(function (sum, cat) {
            return sum + totals[cat];
        }, 0);

        // Filter to only categories that have a positive total
        var activeCategories = VALID_CATEGORIES.filter(function (cat) {
            return totals[cat] > 0;
        });

        if (activeCategories.length === 0 || grandTotal <= 0) {
            drawEmptyChartMessage(ctx, width, height);
            return;
        }

        // ── Geometry ──────────────────────────────────────────────────────
        var centerX = width  / 2;
        var centerY = height / 2;
        var radius  = Math.min(width, height) * 0.38;

        // ── First pass: draw pie segments ─────────────────────────────────
        var segments = [];
        var currentAngle = -Math.PI / 2; // start at 12 o'clock

        activeCategories.forEach(function (cat) {
            var total      = totals[cat];
            var startAngle = currentAngle;
            var sliceAngle = (total / grandTotal) * 2 * Math.PI;
            var endAngle   = startAngle + sliceAngle;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();

            ctx.fillStyle = CHART_COLOURS[cat];
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            segments.push({
                category:   cat,
                total:      total,
                startAngle: startAngle,
                sliceAngle: sliceAngle
            });

            currentAngle = endAngle;
        });

        // ── Second pass: draw labels ──────────────────────────────────────
        ctx.font         = '13px sans-serif';
        ctx.fillStyle    = '#333';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';

        segments.forEach(function (seg) {
            var midAngle    = seg.startAngle + seg.sliceAngle / 2;
            var labelRadius = radius + 20;
            var labelX      = centerX + labelRadius * Math.cos(midAngle);
            var labelY      = centerY + labelRadius * Math.sin(midAngle);
            ctx.fillText(seg.category, labelX, labelY);
        });

        // ── Expose segment data for property testing (Requirement 7) ──────
        canvas._chartSegments = segments;
    }

    // Expose Chart functions on the App namespace
    App.renderChart          = renderChart;
    App.drawEmptyChartMessage = drawEmptyChartMessage;

    // ─── UUID Generation ──────────────────────────────────────────────────────

    /**
     * Generates a UUID v4 string.
     * Uses `crypto.randomUUID()` when available (modern browsers / HTTPS / file://).
     * Falls back to a Math.random()-based hex string for older browsers.
     *
     * @returns {string} A UUID v4 string, e.g. "3f2504e0-4f89-11d3-9a0c-0305e82c3301"
     */
    function generateUUID() {
        // Use the native Crypto API when available
        if (
            typeof crypto !== 'undefined' &&
            typeof crypto.randomUUID === 'function'
        ) {
            return crypto.randomUUID();
        }

        // Fallback: construct a UUID v4 using Math.random() hex segments
        // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (Math.random() * 16) | 0;
            var v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    // Expose UUID helper on the App namespace
    App.generateUUID = generateUUID;

    // ─── App Entry Point (Event Wiring) ───────────────────────────────────────

    /**
     * Bootstrap function — called once the DOM is fully loaded.
     *
     * 1. Hydrates state from Local Storage and performs the initial render.
     * 2. Attaches a submit listener to the Input_Form for adding transactions.
     * 3. Attaches a delegated click listener on the Transaction_List <ul> for
     *    delete-button clicks.
     *
     * Requirements: 1.2, 1.4, 1.5, 3.2, 3.3, 6.1, 6.2, 6.3, 8.1, 8.2
     */
    function bootstrap() {
        // ── 1. Hydrate state from Local Storage and render ─────────────────
        var savedTransactions = loadTransactions();
        var state = hydrateState(savedTransactions);
        renderAll(state);

        // ── 2. Form submit handler ─────────────────────────────────────────
        var form = document.getElementById('transaction-form');
        if (form) {
            form.addEventListener('submit', function (event) {
                event.preventDefault();

                // Read field values from the form
                var nameInput     = document.getElementById('item-name');
                var amountInput   = document.getElementById('item-amount');
                var categoryInput = document.getElementById('item-category');

                var fields = {
                    name:     nameInput     ? nameInput.value     : '',
                    amount:   amountInput   ? amountInput.value   : '',
                    category: categoryInput ? categoryInput.value : ''
                };

                // Validate fields
                var result = validateForm(fields);

                if (!result.valid) {
                    // Show inline errors and bail — do NOT add a transaction
                    showFormErrors(result.errors);
                    return;
                }

                // Build the new Transaction object
                var tx = {
                    id:        generateUUID(),
                    name:      fields.name.trim(),
                    amount:    parseFloat(fields.amount),
                    category:  fields.category,
                    dateAdded: new Date().toISOString()
                };

                // Update state → persist → re-render → reset UI
                state = addTransaction(state, tx);
                saveTransactions(state.transactions);
                renderAll(state);
                clearFormErrors();
                resetForm();
            });
        }

        // ── 3. Event delegation on Transaction List for delete buttons ─────
        var transactionList = document.getElementById('transaction-list');
        if (transactionList) {
            transactionList.addEventListener('click', function (event) {
                // Walk up from the click target to find a delete button with data-id
                var target = event.target;

                // Support clicks on child elements inside the button (e.g. an icon)
                while (target && target !== transactionList) {
                    if (
                        target.tagName === 'BUTTON' &&
                        target.classList.contains('btn-delete') &&
                        target.getAttribute('data-id')
                    ) {
                        var id = target.getAttribute('data-id');
                        state = deleteTransaction(state, id);
                        saveTransactions(state.transactions);
                        renderAll(state);
                        return;
                    }
                    target = target.parentElement;
                }
            });
        }
    }

    // ── Wire bootstrap to DOMContentLoaded ────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        // DOM is already ready (script loaded with defer or at end of <body>)
        bootstrap();
    }

    // Expose namespace for testing
    window.App = App;

}(window.App || {}));
