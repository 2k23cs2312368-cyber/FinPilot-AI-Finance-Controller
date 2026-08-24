const API_BASE = '/api';

async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData && errData.detail) {
        errorMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch (_) {}
    throw new Error(errorMsg);
  }
  return await response.json();
}

export const api = {
  // Dashboard
  getDashboard: (days = 30) => fetch(`${API_BASE}/dashboard?days=${days}`).then(handleResponse),

  // Transactions
  getTransactions: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') query.append(key, val);
    });
    return fetch(`${API_BASE}/transactions?${query.toString()}`).then(handleResponse);
  },
  getTransactionById: (id) => fetch(`${API_BASE}/transactions/${id}`).then(handleResponse),
  analyzeTransaction: (id) => fetch(`${API_BASE}/transactions/${id}/analyze`, { method: 'POST' }).then(handleResponse),
  updateTransactionAction: (id, action) =>
    fetch(`${API_BASE}/transactions/${id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    }).then(handleResponse),
  createTransaction: (data) =>
    fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),

  // Expenses
  getExpenses: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') query.append(key, val);
    });
    return fetch(`${API_BASE}/expenses?${query.toString()}`).then(handleResponse);
  },
  getExpenseCategoriesSummary: () => fetch(`${API_BASE}/expenses/categories`).then(handleResponse),
  createExpense: (data) =>
    fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  updateExpense: (id, data) =>
    fetch(`${API_BASE}/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  deleteExpense: (id) =>
    fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE' }).then(handleResponse),

  // Budgets
  getBudgetOverview: () => fetch(`${API_BASE}/budgets/overview`).then(handleResponse),
  getBudgets: () => fetch(`${API_BASE}/budgets`).then(handleResponse),
  saveBudget: (data) =>
    fetch(`${API_BASE}/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  updateBudget: (id, allocated_amount) =>
    fetch(`${API_BASE}/budgets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allocated_amount })
    }).then(handleResponse),

  // Cash Flow
  getCashFlowForecast: () => fetch(`${API_BASE}/cashflow/forecast`).then(handleResponse),

  // Multi-Source Reconciliation
  getReconciliationOverview: () => fetch(`${API_BASE}/reconciliation/overview`).then(handleResponse),
  getReconciliationExceptions: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') query.append(key, val);
    });
    return fetch(`${API_BASE}/reconciliation/exceptions?${query.toString()}`).then(handleResponse);
  },
  runReconciliation: () =>
    fetch(`${API_BASE}/reconciliation/run`, { method: 'POST' }).then(handleResponse),
  resolveReconciliationException: (id, action, resolution_notes = '') =>
    fetch(`${API_BASE}/reconciliation/exceptions/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, resolution_notes })
    }).then(handleResponse),
  escalateReconciliationException: (id) =>
    fetch(`${API_BASE}/reconciliation/exceptions/${id}/escalate`, { method: 'POST' }).then(handleResponse),
  getReconciliationSources: (limit = 20) =>
    fetch(`${API_BASE}/reconciliation/sources?limit=${limit}`).then(handleResponse),

  // Risks
  getRisks: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') query.append(key, val);
    });
    return fetch(`${API_BASE}/risks?${query.toString()}`).then(handleResponse);
  },
  resolveRisk: (id, data) =>
    fetch(`${API_BASE}/risks/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  escalateRisk: (id) => fetch(`${API_BASE}/risks/${id}/escalate`, { method: 'POST' }).then(handleResponse),

  // Approvals
  getApprovals: (decision) => {
    const query = decision && decision !== 'ALL' ? `?decision=${decision}` : '';
    return fetch(`${API_BASE}/approvals${query}`).then(handleResponse);
  },
  decideApproval: (id, decision, decision_notes) =>
    fetch(`${API_BASE}/approvals/${id}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, decision_notes })
    }).then(handleResponse),

  // Audit Logs
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') query.append(key, val);
    });
    return fetch(`${API_BASE}/audit-logs?${query.toString()}`).then(handleResponse);
  },

  // Insights
  getInsights: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') query.append(key, val);
    });
    return fetch(`${API_BASE}/insights?${query.toString()}`).then(handleResponse);
  },

  // Copilot
  queryCopilot: (question, history = []) =>
    fetch(`${API_BASE}/copilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, conversation_history: history })
    }).then(handleResponse),

  // Reports
  generateReport: () =>
    fetch(`${API_BASE}/reports/generate`, { method: 'POST' }).then(handleResponse),

  // Settings & Seeding
  getSettings: () => fetch(`${API_BASE}/settings`).then(handleResponse),
  updateSettings: (data) =>
    fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  seedDemoData: () =>
    fetch(`${API_BASE}/settings/seed-demo-data`, { method: 'POST' }).then(handleResponse),
};
