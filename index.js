/* ==========================================================================
   PASTELSPEND CORE JAVASCRIPT ENGINE (VANILLA JS)
   ========================================================================== */

// --- STATE MANAGEMENT ---
let state = {
  transactions: [],
  budget: {
    amount: 1500,
    startDate: '',
    endDate: ''
  },
  activeTab: 'dashboard',
  currency: '$',
  startingBalance: 0,
  selectedMonth: 'all',
  filters: {
    search: '',
    type: 'all',
    category: 'all',
    dateFrom: '',
    dateTo: ''
  }
};

// Available categories with color tags matching CSS badges
const CATEGORIES = ['Salary', 'Freelance', 'Food', 'Rent/Bills', 'Shopping', 'Entertainment', 'Travel', 'Others'];

// Predefined mock data to showcase the app instantly on the resume
const MOCK_TRANSACTIONS = [
  { id: '1', desc: 'Monthly Office Salary', type: 'income', amount: 3200, category: 'Salary', date: getRelativeDate(-15), notes: 'Regular monthly stipend credited from corporate headquarters.' },
  { id: '2', desc: 'Target Groceries Store', type: 'expense', amount: 142.50, category: 'Food', date: getRelativeDate(-10), notes: 'Bought weekly groceries. Includes vegetables, milk, bread, cereal, and snacks.' },
  { id: '3', desc: 'Apartment Monthly Rent', type: 'expense', amount: 850.00, category: 'Rent/Bills', date: getRelativeDate(-8), notes: 'Transferred to landlord for the month of July.' },
  { id: '4', desc: 'Starbucks Coffee Break', type: 'expense', amount: 12.80, category: 'Food', date: getRelativeDate(-5), notes: 'Vanilla Latte and Avocado Toast during workspace session.' },
  { id: '5', desc: 'Web Development Freelance', type: 'income', amount: 650.00, category: 'Freelance', date: getRelativeDate(-3), notes: 'Completed building client landing page with custom branding.' },
  { id: '6', desc: 'Cinema and Popcorn', type: 'expense', amount: 48.00, category: 'Entertainment', date: getRelativeDate(-2), notes: 'Watched the new block-buster movie. Tickets for two plus snacks.' },
  { id: '7', desc: 'Gas Station Refill', type: 'expense', amount: 65.00, category: 'Travel', date: getRelativeDate(-1), notes: 'Filled up the car tank. Fuel prices are slightly elevated this week.' },
  { id: '8', desc: 'H&M Summer Clothing', type: 'expense', amount: 110.00, category: 'Shopping', date: getRelativeDate(0), notes: 'Bought two linen shirts and sunglasses for upcoming summer vacation.' }
];

// Helper to get relative dates (YYYY-MM-DD) based on today's local date
function getRelativeDate(daysOffset) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

// --- INITIALIZATION ---
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

function initializeApp() {
  initLocalStorage();
  setDefaultBudgetDates();
  setupEventListeners();
  switchTab(state.activeTab);
  renderAll();
}

// Load state from localStorage or load samples
function initLocalStorage() {
  const savedTransactions = localStorage.getItem('pastel_spend_transactions');
  const savedBudget = localStorage.getItem('pastel_spend_budget');
  const savedCurrency = localStorage.getItem('pastel_spend_currency');
  const savedStartingBalance = localStorage.getItem('pastel_spend_starting_balance');

  if (savedTransactions) {
    state.transactions = JSON.parse(savedTransactions);
  } else {
    state.transactions = MOCK_TRANSACTIONS;
    saveTransactionsToStorage();
  }

  if (savedBudget) {
    state.budget = JSON.parse(savedBudget);
  } else {
    // Set mock budget parameters
    state.budget = {
      amount: 1500,
      startDate: getRelativeDate(-20),
      endDate: getRelativeDate(10)
    };
    saveBudgetToStorage();
  }

  if (savedCurrency) {
    state.currency = savedCurrency;
    document.getElementById('currency-select').value = savedCurrency;
  }

  if (savedStartingBalance) {
    state.startingBalance = parseFloat(savedStartingBalance);
  } else {
    state.startingBalance = 0;
  }
}

function saveTransactionsToStorage() {
  localStorage.setItem('pastel_spend_transactions', JSON.stringify(state.transactions));
}

function saveBudgetToStorage() {
  localStorage.setItem('pastel_spend_budget', JSON.stringify(state.budget));
}

function setDefaultBudgetDates() {
  // If dates are empty in our state, initialize them
  if (!state.budget.startDate) {
    state.budget.startDate = getRelativeDate(-30);
  }
  if (!state.budget.endDate) {
    state.budget.endDate = getRelativeDate(30);
  }
}

// --- EVENT LISTENERS & MODAL ROUTING ---
function setupEventListeners() {
  // Sidebar tab buttons
  document.querySelectorAll('.nav-item').forEach(button => {
    button.addEventListener('click', () => {
      switchTab(button.dataset.tab);
    });
  });

  // Top bar add transaction button
  document.getElementById('btn-add-transaction-top').addEventListener('click', () => {
    openTransactionModal();
  });

  // See All button on Dashboard
  document.getElementById('btn-see-all').addEventListener('click', () => {
    switchTab('transactions');
  });

  // Currency select dropdown
  document.getElementById('currency-select').addEventListener('change', (e) => {
    state.currency = e.target.value;
    localStorage.setItem('pastel_spend_currency', state.currency);
    renderAll();
  });

  // Transaction form submit
  document.getElementById('transaction-form').addEventListener('submit', handleTransactionSubmit);

  // Close modals
  document.getElementById('btn-close-transaction-modal').addEventListener('click', closeTransactionModal);
  document.getElementById('btn-cancel-transaction').addEventListener('click', closeTransactionModal);
  
  document.getElementById('btn-close-budget-modal').addEventListener('click', closeBudgetModal);
  document.getElementById('btn-cancel-budget').addEventListener('click', closeBudgetModal);
  
  // Budget configure triggers
  document.getElementById('btn-configure-budget').addEventListener('click', openBudgetModal);
  document.getElementById('budget-form').addEventListener('submit', handleBudgetSubmit);

  // Filters inputs
  document.getElementById('filter-search').addEventListener('input', (e) => {
    state.filters.search = e.target.value.toLowerCase();
    renderTransactionsPanel();
  });
  document.getElementById('filter-type').addEventListener('change', (e) => {
    state.filters.type = e.target.value;
    renderTransactionsPanel();
  });
  document.getElementById('filter-category').addEventListener('change', (e) => {
    state.filters.category = e.target.value;
    renderTransactionsPanel();
  });
  document.getElementById('filter-date-from').addEventListener('change', (e) => {
    state.filters.dateFrom = e.target.value;
    renderTransactionsPanel();
  });
  document.getElementById('filter-date-to').addEventListener('change', (e) => {
    state.filters.dateTo = e.target.value;
    renderTransactionsPanel();
  });
  document.getElementById('btn-reset-filters').addEventListener('click', resetFilters);

  // Export CSV
  document.getElementById('btn-export-csv').addEventListener('click', exportCSV);

  // Chart view toggles
  document.querySelectorAll('.chart-toggles .toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.chart-toggles .toggle-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const chartView = e.target.dataset.chartView;
      renderAnalyticsCharts(chartView);
    });
  });

  // Notes Search Bar
  document.getElementById('notes-search').addEventListener('input', (e) => {
    renderNotesGallery(e.target.value.toLowerCase());
  });

  // Set starting balance edit trigger
  document.getElementById('btn-edit-balance').addEventListener('click', openBalanceModal);
  document.getElementById('balance-form').addEventListener('submit', handleBalanceSubmit);
  document.getElementById('btn-close-balance-modal').addEventListener('click', closeBalanceModal);
  document.getElementById('btn-cancel-balance').addEventListener('click', closeBalanceModal);

  // Set salary edit trigger
  document.getElementById('btn-edit-salary').addEventListener('click', openSalaryModal);
  document.getElementById('salary-form').addEventListener('submit', handleSalarySubmit);
  document.getElementById('btn-close-salary-modal').addEventListener('click', closeSalaryModal);
  document.getElementById('btn-cancel-salary').addEventListener('click', closeSalaryModal);

  // Reset App / Slate trigger
  document.getElementById('btn-reset-app').addEventListener('click', resetAppToCleanSlate);

  // Month selector trigger
  const monthSelect = document.getElementById('month-select');
  const customMonthInput = document.getElementById('custom-month-input');
  
  monthSelect.addEventListener('change', (e) => {
    state.selectedMonth = e.target.value;
    if (e.target.value === 'custom') {
      customMonthInput.classList.remove('hidden');
      const now = new Date();
      customMonthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    } else {
      customMonthInput.classList.add('hidden');
    }
    renderAll();
  });
  
  customMonthInput.addEventListener('change', () => {
    renderAll();
  });

  // Form radios styling sync
  document.querySelectorAll('input[name="tx-type"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const expenseLabel = document.getElementById('type-expense').closest('.type-toggle-btn');
      const incomeLabel = document.getElementById('type-income').closest('.type-toggle-btn');
      if (e.target.value === 'expense') {
        expenseLabel.classList.add('active-expense');
        incomeLabel.classList.remove('active-income');
      } else {
        incomeLabel.classList.add('active-income');
        expenseLabel.classList.remove('active-expense');
      }
    });
  });
}

// Switch dashboard views (tabs)
function switchTab(tabId) {
  state.activeTab = tabId;
  
  // Update sidebar active state
  document.querySelectorAll('.nav-item').forEach(btn => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Toggle Tab Panels
  document.querySelectorAll('.tab-panel').forEach(panel => {
    if (panel.id === `tab-${tabId}`) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  // Update navbar page title dynamically
  const titles = {
    dashboard: 'Dashboard Insights',
    transactions: 'Detailed Transactions',
    analytics: 'Visual Spending Analytics',
    notes: 'Spend Reflections Gallery'
  };
  document.getElementById('page-title-text').innerText = titles[tabId] || 'Dashboard';
  
  // Specific panel renders
  if (tabId === 'dashboard') {
    renderDashboardPanel();
  } else if (tabId === 'transactions') {
    renderTransactionsPanel();
  } else if (tabId === 'analytics') {
    renderAnalyticsCharts('weekly');
  } else if (tabId === 'notes') {
    renderNotesGallery();
  }
}

// Reset filters
function resetFilters() {
  document.getElementById('filter-search').value = '';
  document.getElementById('filter-type').value = 'all';
  document.getElementById('filter-category').value = 'all';
  document.getElementById('filter-date-from').value = '';
  document.getElementById('filter-date-to').value = '';
  
  state.filters = {
    search: '',
    type: 'all',
    category: 'all',
    dateFrom: '',
    dateTo: ''
  };
  renderTransactionsPanel();
}

// --- RENDER UTILITIES ---
function renderAll() {
  calculateStats();
  updateBudgetVisuals();
  
  if (state.activeTab === 'dashboard') {
    renderDashboardPanel();
  } else if (state.activeTab === 'transactions') {
    renderTransactionsPanel();
  } else if (state.activeTab === 'analytics') {
    renderAnalyticsCharts('weekly');
  } else if (state.activeTab === 'notes') {
    renderNotesGallery();
  }
}

// Main metric calculations
function calculateStats() {
  let incomeTotal = 0;
  let expenseTotal = 0;

  const filteredTx = filterTransactionsByMonth(state.transactions);

  filteredTx.forEach(tx => {
    if (tx.type === 'income') {
      incomeTotal += tx.amount;
    } else {
      expenseTotal += tx.amount;
    }
  });

  const balanceTotal = state.startingBalance + incomeTotal - expenseTotal;

  document.getElementById('total-balance').innerText = formatCurrency(balanceTotal);
  document.getElementById('total-income').innerText = formatCurrency(incomeTotal);
  document.getElementById('total-expense').innerText = formatCurrency(expenseTotal);
  
  // Change balance text color if negative
  const balanceValEl = document.getElementById('total-balance');
  if (balanceTotal < 0) {
    balanceValEl.style.color = '#c53030';
  } else {
    balanceValEl.style.color = '';
  }
}

// Helper to format currency
function formatCurrency(amount) {
  return `${state.currency}${Math.abs(amount).toFixed(2)}`;
}

// --- ACTIVE BUDGET MODULE ---
function updateBudgetVisuals() {
  const budget = state.budget;
  const limit = budget.amount;
  const start = budget.startDate;
  const end = budget.endDate;

  // Render current limit & timeframe details
  document.getElementById('budget-limit-val').innerText = formatCurrency(limit);
  
  if (start && end) {
    document.getElementById('budget-period-val').innerText = `Period: ${formatDateLabel(start)} to ${formatDateLabel(end)}`;
  } else {
    document.getElementById('budget-period-val').innerText = 'No period set. Configure limit.';
  }

  // Calculate expenses that occur specifically within the budget date range
  let spentInPeriod = 0;
  state.transactions.forEach(tx => {
    if (tx.type === 'expense') {
      let isWithin = true;
      if (start && tx.date < start) isWithin = false;
      if (end && tx.date > end) isWithin = false;
      
      if (isWithin) {
        spentInPeriod += tx.amount;
      }
    }
  });

  const remaining = limit - spentInPeriod;
  const percentage = limit > 0 ? Math.min(Math.round((spentInPeriod / limit) * 100), 200) : 0;

  document.getElementById('budget-spent-val').innerText = formatCurrency(spentInPeriod);
  
  // Set remaining value text (negative reflects overspent amount)
  const remainingEl = document.getElementById('budget-remaining-val');
  if (remaining < 0) {
    remainingEl.innerText = `-${formatCurrency(remaining)}`;
    remainingEl.className = 'item-val text-expense';
  } else {
    remainingEl.innerText = formatCurrency(remaining);
    remainingEl.className = 'item-val text-income';
  }

  document.getElementById('budget-percentage').innerText = `${percentage}%`;

  // Update SVG Progress Circle Ring
  const circle = document.getElementById('budget-progress-circle');
  const radius = circle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius; // Approx 439.82
  
  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  
  // Calculate offset. Cap progress at 100% physically to avoid drawing reverse shapes
  const capPercentage = Math.min(percentage, 100);
  const offset = circumference - (capPercentage / 100) * circumference;
  circle.style.strokeDashoffset = offset;

  // Change progress ring stroke color based on percentage threshold
  const circleColorMap = (percent) => {
    if (percent < 80) return '#88d8b0'; // Safe pastel green
    if (percent < 100) return '#fbd38d'; // Warning pastel yellow/orange
    return '#feb2b2'; // Exceeded pastel red
  };
  circle.style.stroke = circleColorMap(percentage);

  // Manage Insight and Alerts Banners
  const alertContainer = document.getElementById('budget-alert-banner');
  const insightStatusEl = document.getElementById('insight-budget-status');

  if (percentage === 0 && !start) {
    alertContainer.classList.add('hidden');
    insightStatusEl.innerText = 'No Budget Configured';
    return;
  }

  // Update Insight Text
  if (percentage < 80) {
    insightStatusEl.innerText = 'Healthy (Under 80%)';
    insightStatusEl.style.color = '#2f855a';
  } else if (percentage < 100) {
    insightStatusEl.innerText = 'Caution (80% - 99%)';
    insightStatusEl.style.color = '#dd6b20';
  } else {
    insightStatusEl.innerText = 'Over Budget!';
    insightStatusEl.style.color = '#c53030';
  }

  // Render Dashboard Warnings
  if (percentage >= 100) {
    alertContainer.classList.remove('hidden');
    alertContainer.innerHTML = `
      <div class="budget-alert danger">
        <div class="budget-alert-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div class="budget-alert-info">
          <div class="budget-alert-title">Budget Limit Exceeded!</div>
          <div class="budget-alert-desc">You have spent <strong>${percentage}%</strong> of your configured budget in the active date range. Overspent by <strong>${formatCurrency(Math.abs(remaining))}</strong>.</div>
        </div>
      </div>
    `;
  } else if (percentage >= 80) {
    alertContainer.classList.remove('hidden');
    alertContainer.innerHTML = `
      <div class="budget-alert warning">
        <div class="budget-alert-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div class="budget-alert-info">
          <div class="budget-alert-title">Budget Warning (Nearing Limit)</div>
          <div class="budget-alert-desc">You have used <strong>${percentage}%</strong> of your budget. Remaining limit is only <strong>${formatCurrency(remaining)}</strong>. Keep an eye on expenses!</div>
        </div>
      </div>
    `;
  } else {
    alertContainer.classList.add('hidden');
  }
}

// --- PANEL 1: DASHBOARD ---
function renderDashboardPanel() {
  const monthFiltered = filterTransactionsByMonth(state.transactions);

  // Update recent table list (shows up to 5 items, sorted by date desc)
  const sortedTx = [...monthFiltered].sort((a, b) => new Date(b.date) - new Date(a.date));
  const recentTx = sortedTx.slice(0, 5);
  
  const tbody = document.getElementById('recent-transactions-tbody');
  const emptyState = document.getElementById('recent-empty-state');
  
  tbody.innerHTML = '';
  
  if (recentTx.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  } else {
    emptyState.classList.add('hidden');
  }

  recentTx.forEach(tx => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${tx.desc}</strong></td>
      <td><span class="category-badge badge-${tx.category.replace('/', '')}">${tx.category}</span></td>
      <td>${formatDateLabel(tx.date)}</td>
      <td><span class="${tx.type === 'income' ? 'text-income' : 'text-expense'}">${tx.type === 'income' ? 'Income' : 'Expense'}</span></td>
      <td><strong class="${tx.type === 'income' ? 'text-income' : 'text-expense'}">${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}</strong></td>
      <td>
        <div class="action-buttons">
          <button class="action-btn edit" onclick="editTransaction('${tx.id}')" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
          <button class="action-btn delete" onclick="deleteTransaction('${tx.id}')" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Calculate Quick Insights values
  calculateInsights();
}

function calculateInsights() {
  // 1. Top Spending Category
  const categoriesExpMap = {};
  let maxSpent = 0;
  let topCategory = 'N/A';

  state.transactions.forEach(tx => {
    if (tx.type === 'expense') {
      categoriesExpMap[tx.category] = (categoriesExpMap[tx.category] || 0) + tx.amount;
      if (categoriesExpMap[tx.category] > maxSpent) {
        maxSpent = categoriesExpMap[tx.category];
        topCategory = tx.category;
      }
    }
  });

  document.getElementById('insight-top-category').innerText = topCategory !== 'N/A' 
    ? `${topCategory} (${formatCurrency(maxSpent)})` 
    : 'No Expenses';

  // 2. Savings Rate Calculation
  let totalInc = 0;
  let totalExp = 0;
  
  state.transactions.forEach(tx => {
    if (tx.type === 'income') totalInc += tx.amount;
    else totalExp += tx.amount;
  });

  let savingsRate = 0;
  if (totalInc > 0) {
    savingsRate = Math.round(((totalInc - totalExp) / totalInc) * 100);
  }

  document.getElementById('insight-savings-rate').innerText = savingsRate > 0 
    ? `${savingsRate}%` 
    : '0% (Or Negative)';
}

// --- PANEL 2: DETAILED TRANSACTIONS LIST ---
function renderTransactionsPanel() {
  const f = state.filters;
  const monthFiltered = filterTransactionsByMonth(state.transactions);
  
  // Filter core array
  let filtered = monthFiltered.filter(tx => {
    // Search filter (desc & notes)
    if (f.search && !tx.desc.toLowerCase().includes(f.search) && !tx.notes.toLowerCase().includes(f.search)) {
      return false;
    }
    // Type filter
    if (f.type !== 'all' && tx.type !== f.type) {
      return false;
    }
    // Category filter
    if (f.category !== 'all' && tx.category !== f.category) {
      return false;
    }
    // Date from
    if (f.dateFrom && tx.date < f.dateFrom) {
      return false;
    }
    // Date to
    if (f.dateTo && tx.date > f.dateTo) {
      return false;
    }
    return true;
  });

  // Sort by date desc
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  const tbody = document.getElementById('all-transactions-tbody');
  const emptyState = document.getElementById('all-empty-state');
  
  tbody.innerHTML = '';
  
  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  } else {
    emptyState.classList.add('hidden');
  }

  filtered.forEach(tx => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${tx.desc}</strong></td>
      <td><span class="category-badge badge-${tx.category.replace('/', '')}">${tx.category}</span></td>
      <td>${formatDateLabel(tx.date)}</td>
      <td><span class="${tx.type === 'income' ? 'text-income' : 'text-expense'}">${tx.type === 'income' ? 'Income' : 'Expense'}</span></td>
      <td><strong class="${tx.type === 'income' ? 'text-income' : 'text-expense'}">${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}</strong></td>
      <td><span class="note-preview-text" title="${tx.notes || ''}">${tx.notes ? tx.notes : '-'}</span></td>
      <td>
        <div class="action-buttons">
          <button class="action-btn edit" onclick="editTransaction('${tx.id}')" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
          <button class="action-btn delete" onclick="deleteTransaction('${tx.id}')" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// --- PANEL 3: ANALYTICS (SVG GRAPHICS) ---
function renderAnalyticsCharts(viewType) {
  const container = document.getElementById('bar-chart-container');
  const donutContainer = document.getElementById('donut-chart-container');
  const legendContainer = document.getElementById('donut-legend-container');

  if (!container || !donutContainer) return;

  // Clear previous canvas renders
  container.innerHTML = '';
  donutContainer.innerHTML = '';
  legendContainer.innerHTML = '';

  const monthFiltered = filterTransactionsByMonth(state.transactions);
  const expensesOnly = monthFiltered.filter(t => t.type === 'expense');

  // --- 1. RENDER SVG BAR CHART ---
  let chartData = [];
  let titleLabel = '';

  if (viewType === 'weekly') {
    // Past 7 Days Comparison
    titleLabel = 'Daily Spend (Past 7 Days)';
    for (let i = 6; i >= 0; i--) {
      const dateStr = getRelativeDate(-i);
      const dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
      const amount = expensesOnly
        .filter(t => t.date === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);
      chartData.push({ label: dayName, value: amount, date: dateStr });
    }
  } else if (viewType === 'monthly') {
    // Current month split into 4 weeks
    titleLabel = 'Weekly Spend breakdown';
    const weeks = [
      { name: 'Wk 1', startOffset: -28, endOffset: -21 },
      { name: 'Wk 2', startOffset: -20, endOffset: -14 },
      { name: 'Wk 3', startOffset: -13, endOffset: -7 },
      { name: 'Wk 4', startOffset: -6, endOffset: 0 }
    ];

    weeks.forEach(w => {
      const dateStart = getRelativeDate(w.startOffset);
      const dateEnd = getRelativeDate(w.endOffset);
      const amount = expensesOnly
        .filter(t => t.date >= dateStart && t.date <= dateEnd)
        .reduce((sum, t) => sum + t.amount, 0);
      chartData.push({ label: w.name, value: amount, info: `${formatDateLabel(dateStart)} - ${formatDateLabel(dateEnd)}` });
    });
  } else if (viewType === 'yearly') {
    // Yearly breakdown by months of current year
    titleLabel = 'Monthly Spend breakdown';
    const currentYear = new Date().getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    months.forEach((m, idx) => {
      const amount = expensesOnly
        .filter(t => {
          const txDate = new Date(t.date);
          return txDate.getFullYear() === currentYear && txDate.getMonth() === idx;
        })
        .reduce((sum, t) => sum + t.amount, 0);
      chartData.push({ label: m, value: amount });
    });
  }

  // Draw the SVG Bar Chart
  const svgWidth = container.clientWidth || 550;
  const svgHeight = 280;
  const paddingLeft = 50;
  const paddingBottom = 40;
  const paddingTop = 20;
  const paddingRight = 20;

  const chartInnerWidth = svgWidth - paddingLeft - paddingRight;
  const chartInnerHeight = svgHeight - paddingTop - paddingBottom;

  // Max value calculation for scaling
  const maxVal = Math.max(...chartData.map(d => d.value), 100); 
  const yMax = Math.ceil(maxVal / 50) * 50; // round up to nearest 50

  // SVG Shell
  let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" class="svg-bar-chart-element">`;

  // Draw horizontal grid lines and Y axis text labels (4 levels)
  const gridLevels = 4;
  for (let i = 0; i <= gridLevels; i++) {
    const val = (yMax / gridLevels) * i;
    const yPos = svgHeight - paddingBottom - (val / yMax) * chartInnerHeight;
    svgContent += `
      <line class="chart-grid-line ${i === 0 ? 'bold' : ''}" x1="${paddingLeft}" y1="${yPos}" x2="${svgWidth - paddingRight}" y2="${yPos}" />
      <text class="chart-axis-text y-axis" x="${paddingLeft - 10}" y="${yPos + 4}">${state.currency}${Math.round(val)}</text>
    `;
  }

  // Draw Bars
  const numBars = chartData.length;
  const barGap = 16;
  const totalGapsWidth = barGap * (numBars - 1);
  const barWidth = (chartInnerWidth - totalGapsWidth) / numBars;

  chartData.forEach((d, idx) => {
    const xPos = paddingLeft + idx * (barWidth + barGap);
    const barHeight = d.value > 0 ? (d.value / yMax) * chartInnerHeight : 3; // minimal height for visual feedback
    const yPos = svgHeight - paddingBottom - barHeight;

    // Draw the bar and text underneath
    svgContent += `
      <g class="chart-bar-group" data-label="${d.label}" data-val="${d.value}" data-info="${d.info || ''}">
        <rect class="chart-bar-rect" 
              x="${xPos}" 
              y="${yPos}" 
              width="${barWidth}" 
              height="${barHeight}" 
              fill="${idx % 2 === 0 ? '#b2f5ea' : '#e9d8fd'}" 
              rx="4" ry="4" 
              onmouseover="showChartTooltip(event)" 
              onmouseout="hideChartTooltip()" />
        <text class="chart-axis-text" x="${xPos + barWidth / 2}" y="${svgHeight - paddingBottom + 20}">${d.label}</text>
      </g>
    `;
  });

  svgContent += `</svg>`;
  container.innerHTML = svgContent;

  // --- 2. RENDER SVG DONUT PIE CHART ---
  const catSums = {};
  let totalSpending = 0;

  // Filter only expenses and aggregate sums
  expensesOnly.forEach(tx => {
    catSums[tx.category] = (catSums[tx.category] || 0) + tx.amount;
    totalSpending += tx.amount;
  });

  // Category Color Map (Pastel variants matching badges)
  const catColors = {
    Salary: '#88d8b0',
    Freelance: '#81e6d9',
    Food: '#ffd3b6',
    'Rent/Bills': '#ffaaa5',
    Shopping: '#ff8b94',
    Entertainment: '#dfb2f4',
    Travel: '#9ac8ff',
    Others: '#cbd5e0'
  };

  const donutRad = 55;
  const strokeW = 18;
  const centerCoord = 90;
  const circum = 2 * Math.PI * donutRad; // ~345.57

  let donutSvg = `
    <svg width="180" height="180" viewBox="0 0 180 180" class="svg-donut-element">
      <circle cx="${centerCoord}" cy="${centerCoord}" r="${donutRad}" fill="transparent" stroke="#edf2f7" stroke-width="${strokeW}" />
  `;

  let accumulatedPercent = 0;
  const uniqueCategories = Object.keys(catSums);

  if (uniqueCategories.length === 0 || totalSpending === 0) {
    // Show empty donut message
    donutSvg += `
        <circle cx="${centerCoord}" cy="${centerCoord}" r="${donutRad}" fill="transparent" stroke="#edf2f7" stroke-dasharray="10 5" stroke-width="4" />
        <text x="${centerCoord}" y="${centerCoord + 4}" font-size="11" font-weight="600" fill="#a0aec0" text-anchor="middle">No Spendings</text>
      </svg>
    `;
    donutContainer.innerHTML = donutSvg;
    legendContainer.innerHTML = '<div class="empty-state">No category breakdown available.</div>';
    return;
  }

  uniqueCategories.forEach((cat) => {
    const val = catSums[cat];
    const percentage = val / totalSpending;
    const strokeDash = circum * percentage;
    const offset = circum - (accumulatedPercent * circum);
    const color = catColors[cat] || '#cbd5e0';

    donutSvg += `
      <circle class="donut-slice" 
              cx="${centerCoord}" 
              cy="${centerCoord}" 
              r="${donutRad}" 
              fill="transparent" 
              stroke="${color}" 
              stroke-width="${strokeW}" 
              stroke-dasharray="${strokeDash} ${circum}" 
              stroke-dashoffset="${offset}" 
              transform="rotate(-90 ${centerCoord} ${centerCoord})" 
              onmouseover="showDonutTooltip(event, '${cat}', ${val})" 
              onmouseout="hideChartTooltip()" />
    `;

    accumulatedPercent += percentage;

    // Render legend badge list items
    const legItem = document.createElement('div');
    legItem.className = 'legend-item';
    legItem.innerHTML = `
      <span class="legend-color-dot" style="background-color: ${color}"></span>
      <span>${cat} (${Math.round(percentage * 100)}%)</span>
    `;
    legendContainer.appendChild(legItem);
  });

  // Draw central text showing total spent
  donutSvg += `
      <circle cx="${centerCoord}" cy="${centerCoord}" r="${donutRad - strokeW/2 - 2}" fill="#ffffff" />
      <g>
        <text x="${centerCoord}" y="${centerCoord - 8}" font-size="10" font-weight="600" fill="#a0aec0" text-anchor="middle" letter-spacing="0.5">TOTAL SPENT</text>
        <text x="${centerCoord}" y="${centerCoord + 12}" font-size="14" font-weight="800" fill="#2d3748" text-anchor="middle">${formatCurrency(totalSpending)}</text>
      </g>
    </svg>
  `;
  donutContainer.innerHTML = donutSvg;
}

// Tooltip helpers
function showChartTooltip(e) {
  const rect = e.target;
  const group = rect.parentNode;
  const label = group.getAttribute('data-label');
  const val = parseFloat(group.getAttribute('data-val'));
  const extra = group.getAttribute('data-info');

  let tooltip = document.getElementById('chart-tooltip-bubble');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'chart-tooltip-bubble';
    tooltip.className = 'chart-tooltip-bubble';
    document.body.appendChild(tooltip);
  }

  tooltip.innerHTML = `
    <strong>${label}</strong><br/>
    Amount: ${formatCurrency(val)}
    ${extra ? `<div style="font-size:10px; font-weight:400; color:#718096; margin-top:2px;">${extra}</div>` : ''}
  `;
  tooltip.style.opacity = '1';
  
  // Align position relative to mouse cursor
  tooltip.style.left = `${e.pageX}px`;
  tooltip.style.top = `${e.pageY}px`;
}

function showDonutTooltip(e, label, val) {
  let tooltip = document.getElementById('chart-tooltip-bubble');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'chart-tooltip-bubble';
    tooltip.className = 'chart-tooltip-bubble';
    document.body.appendChild(tooltip);
  }

  tooltip.innerHTML = `
    <strong>${label} Breakdown</strong><br/>
    Total Spent: ${formatCurrency(val)}
  `;
  tooltip.style.opacity = '1';
  tooltip.style.left = `${e.pageX}px`;
  tooltip.style.top = `${e.pageY}px`;
}

function hideChartTooltip() {
  const tooltip = document.getElementById('chart-tooltip-bubble');
  if (tooltip) {
    tooltip.style.opacity = '0';
  }
}

// --- PANEL 4: STICKY NOTES GALLERY ---
function renderNotesGallery(searchQuery = '') {
  const container = document.getElementById('notes-grid-container');
  const emptyState = document.getElementById('notes-empty-state');
  
  container.innerHTML = '';

  // Sticky notes themes matching categories
  const stickyThemes = {
    Salary: 'green',
    Freelance: 'green',
    Food: 'yellow',
    'Rent/Bills': 'pink',
    Shopping: 'pink',
    Entertainment: 'purple',
    Travel: 'blue',
    Others: 'purple'
  };

  // Filter notes that actually exist and match text query
  const notesTx = state.transactions.filter(tx => {
    if (!tx.notes || tx.notes.trim() === '') return false;
    if (searchQuery && !tx.notes.toLowerCase().includes(searchQuery) && !tx.desc.toLowerCase().includes(searchQuery)) return false;
    return true;
  });

  if (notesTx.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  } else {
    emptyState.classList.add('hidden');
  }

  notesTx.forEach(tx => {
    const theme = stickyThemes[tx.category] || 'yellow';
    const noteCard = document.createElement('div');
    noteCard.className = `sticky-note-card note-theme-${theme}`;
    noteCard.innerHTML = `
      <span class="note-pin"></span>
      <div class="note-date">${formatDateLabel(tx.date)}</div>
      <div class="note-text">${tx.notes}</div>
      <div class="note-footer">
        <div class="note-tx-info">
          <span class="note-tx-title">${tx.desc}</span>
          <span class="note-tx-amount ${tx.type === 'income' ? 'text-income' : 'text-expense'}">
            ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}
          </span>
        </div>
        <div class="note-actions">
          <button class="note-act-btn" onclick="editTransaction('${tx.id}')" title="Edit Note/Tx">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
        </div>
      </div>
    `;
    container.appendChild(noteCard);
  });
}

// --- FORM HANDLING & MUTATION ROUTING ---
function handleTransactionSubmit(e) {
  e.preventDefault();
  
  const txId = document.getElementById('transaction-id').value;
  const desc = document.getElementById('tx-desc').value.trim();
  const type = document.querySelector('input[name="tx-type"]:checked').value;
  const amount = parseFloat(document.getElementById('tx-amount').value);
  const category = document.getElementById('tx-category').value;
  const date = document.getElementById('tx-date').value;
  const notes = document.getElementById('tx-notes').value.trim();

  if (!desc || isNaN(amount) || !category || !date) {
    alert('Please fill in all required fields accurately.');
    return;
  }

  if (txId) {
    // Edit Mode
    const index = state.transactions.findIndex(t => t.id === txId);
    if (index !== -1) {
      state.transactions[index] = { id: txId, desc, type, amount, category, date, notes };
    }
  } else {
    // Add Mode
    const newTx = {
      id: Date.now().toString(),
      desc,
      type,
      amount,
      category,
      date,
      notes
    };
    state.transactions.push(newTx);
  }

  saveTransactionsToStorage();
  closeTransactionModal();
  renderAll();
}

function handleBudgetSubmit(e) {
  e.preventDefault();
  
  const limit = parseFloat(document.getElementById('budget-limit').value);
  const startDate = document.getElementById('budget-start-date').value;
  const endDate = document.getElementById('budget-end-date').value;

  if (isNaN(limit) || !startDate || !endDate) {
    alert('Please specify a valid limit and date boundaries.');
    return;
  }

  if (startDate > endDate) {
    alert('Start Date cannot occur after End Date.');
    return;
  }

  state.budget = { amount: limit, startDate, endDate };
  saveBudgetToStorage();
  closeBudgetModal();
  renderAll();
}

// --- API ACTIONS TRIGGERED FROM DOM ---
window.deleteTransaction = function(id) {
  if (confirm('Are you sure you want to delete this transaction record?')) {
    state.transactions = state.transactions.filter(t => t.id !== id);
    saveTransactionsToStorage();
    renderAll();
    
    // If tooltip is active, clean it up
    hideChartTooltip();
  }
};

window.editTransaction = function(id) {
  const tx = state.transactions.find(t => t.id === id);
  if (!tx) return;

  // Open Modal populated with existing values
  openTransactionModal(true);
  
  document.getElementById('transaction-id').value = tx.id;
  document.getElementById('tx-desc').value = tx.desc;
  document.getElementById('tx-amount').value = tx.amount;
  document.getElementById('tx-category').value = tx.category;
  document.getElementById('tx-date').value = tx.date;
  document.getElementById('tx-notes').value = tx.notes || '';

  // Trigger radio visual selection state
  const typeExpense = document.getElementById('type-expense');
  const typeIncome = document.getElementById('type-income');
  const expenseLabel = document.getElementById('type-expense').closest('.type-toggle-btn');
  const incomeLabel = document.getElementById('type-income').closest('.type-toggle-btn');

  if (tx.type === 'expense') {
    typeExpense.checked = true;
    expenseLabel.classList.add('active-expense');
    incomeLabel.classList.remove('active-income');
  } else {
    typeIncome.checked = true;
    incomeLabel.classList.add('active-income');
    expenseLabel.classList.remove('active-expense');
  }
};

// --- MODAL UTILITIES ---
function openTransactionModal(isEdit = false) {
  const modal = document.getElementById('transaction-modal');
  modal.classList.add('active');
  
  // Set currency sign label on inputs
  document.getElementById('modal-currency-addon').innerText = state.currency;

  if (!isEdit) {
    // Reset values for new entries
    document.getElementById('transaction-id').value = '';
    document.getElementById('transaction-form').reset();
    document.getElementById('tx-date').value = getRelativeDate(0); // default to today
    
    // Set radio buttons visually to Expense default
    document.getElementById('type-expense').checked = true;
    document.getElementById('type-expense').closest('.type-toggle-btn').classList.add('active-expense');
    document.getElementById('type-income').closest('.type-toggle-btn').classList.remove('active-income');
    
    document.getElementById('modal-title-text').innerText = 'Add New Transaction';
  } else {
    document.getElementById('modal-title-text').innerText = 'Modify Transaction Entry';
  }
}

function closeTransactionModal() {
  document.getElementById('transaction-modal').classList.remove('active');
}

function openBudgetModal() {
  const modal = document.getElementById('budget-modal');
  modal.classList.add('active');

  // Fill in active state budget values
  document.getElementById('budget-modal-currency-addon').innerText = state.currency;
  document.getElementById('budget-limit').value = state.budget.amount || '';
  document.getElementById('budget-start-date').value = state.budget.startDate || '';
  document.getElementById('budget-end-date').value = state.budget.endDate || '';
}

function closeBudgetModal() {
  document.getElementById('budget-modal').classList.remove('active');
}

// --- EXTRA MODAL CONTROLS ---
function openBalanceModal() {
  const modal = document.getElementById('balance-modal');
  modal.classList.add('active');
  document.getElementById('balance-modal-currency-addon').innerText = state.currency;
  document.getElementById('starting-balance-input').value = state.startingBalance;
}

function closeBalanceModal() {
  document.getElementById('balance-modal').classList.remove('active');
}

function handleBalanceSubmit(e) {
  e.preventDefault();
  const amt = parseFloat(document.getElementById('starting-balance-input').value);
  if (isNaN(amt)) return;
  state.startingBalance = amt;
  localStorage.setItem('pastel_spend_starting_balance', amt);
  closeBalanceModal();
  renderAll();
}

function openSalaryModal() {
  const modal = document.getElementById('salary-modal');
  modal.classList.add('active');
  document.getElementById('salary-modal-currency-addon').innerText = state.currency;
  document.getElementById('salary-amount-input').value = '';
}

function closeSalaryModal() {
  document.getElementById('salary-modal').classList.remove('active');
}

function handleSalarySubmit(e) {
  e.preventDefault();
  const amt = parseFloat(document.getElementById('salary-amount-input').value);
  if (isNaN(amt) || amt <= 0) return;

  let targetDate = getRelativeDate(0);
  if (state.selectedMonth === 'current') {
    const now = new Date();
    targetDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  } else if (state.selectedMonth === 'last') {
    const lastMonthDate = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    targetDate = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}-01`;
  } else if (state.selectedMonth === 'custom') {
    const customVal = document.getElementById('custom-month-input').value;
    if (customVal) {
      targetDate = `${customVal}-01`;
    }
  }

  const newTx = {
    id: Date.now().toString(),
    desc: 'Monthly Salary Deposit',
    type: 'income',
    amount: amt,
    category: 'Salary',
    date: targetDate,
    notes: 'Quick deposited salary income.'
  };

  state.transactions.push(newTx);
  saveTransactionsToStorage();
  closeSalaryModal();
  renderAll();
}

function resetAppToCleanSlate() {
  if (confirm('Are you sure you want to delete all transactions and reset starting balance to 0? This cannot be undone.')) {
    state.transactions = [];
    state.startingBalance = 0;
    state.budget = {
      amount: 1500,
      startDate: getRelativeDate(0),
      endDate: getRelativeDate(30)
    };
    saveTransactionsToStorage();
    saveBudgetToStorage();
    localStorage.setItem('pastel_spend_starting_balance', 0);
    renderAll();
  }
}

// Helper to filter transactions by month
function filterTransactionsByMonth(txList) {
  if (state.selectedMonth === 'all') return txList;
  
  const { start, end } = getMonthDateRange(state.selectedMonth);
  if (!start || !end) return txList;
  
  return txList.filter(tx => tx.date >= start && tx.date <= end);
}

// Helper to get date boundaries for month values
function getMonthDateRange(filterVal) {
  const now = new Date();
  let start = '';
  let end = '';

  if (filterVal === 'current') {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    start = `${year}-${month}-01`;
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    end = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
  } else if (filterVal === 'last') {
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = lastMonthDate.getFullYear();
    const month = String(lastMonthDate.getMonth() + 1).padStart(2, '0');
    start = `${year}-${month}-01`;
    const lastDay = new Date(year, lastMonthDate.getMonth() + 1, 0).getDate();
    end = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
  } else if (filterVal === 'custom') {
    const customVal = document.getElementById('custom-month-input').value;
    if (customVal) {
      start = `${customVal}-01`;
      const parts = customVal.split('-');
      const lastDay = new Date(parseInt(parts[0]), parseInt(parts[1]), 0).getDate();
      end = `${customVal}-${String(lastDay).padStart(2, '0')}`;
    }
  }
  return { start, end };
}

// --- GENERAL UTILS & FORMATTING ---
function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

// CSV exporter (highly visual resume feature!)
function exportCSV() {
  if (state.transactions.length === 0) {
    alert('No transactions available to export.');
    return;
  }

  // Construct CSV Header Row
  let csvContent = 'ID,Description,Type,Amount,Category,Date,Notes\r\n';

  state.transactions.forEach(tx => {
    const row = [
      tx.id,
      `"${tx.desc.replace(/"/g, '""')}"`,
      tx.type,
      tx.amount.toFixed(2),
      tx.category,
      tx.date,
      `"${(tx.notes || '').replace(/"/g, '""')}"`
    ];
    csvContent += row.join(',') + '\r\n';
  });

  // Create mock download link element
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `PastelSpend_Export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}