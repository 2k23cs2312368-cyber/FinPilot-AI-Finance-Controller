import React, { useState, useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { ToastContainer } from './components/common/Feedback';
import { api } from './services/api';

// Pages
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Expenses } from './pages/Expenses';
import { Budgets } from './pages/Budgets';
import { CashFlow } from './pages/CashFlow';
import { RiskCenter } from './pages/RiskCenter';
import { AIInsights } from './pages/AIInsights';
import { Copilot } from './pages/Copilot';
import { ApprovalCenter } from './pages/ApprovalCenter';
import { AuditLogs } from './pages/AuditLogs';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Demo auto-logged in or toggleable
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  const [counts, setCounts] = useState({ critical_risks_count: 0, pending_approvals_count: 0 });
  const [businessName, setBusinessName] = useState('Saroha Cloud Innovations Pvt Ltd');
  const [aiEngineStatus, setAiEngineStatus] = useState('Demo AI Mode');
  const [isSeeding, setIsSeeding] = useState(false);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshMeta = async () => {
    try {
      const [dashData, settingsData] = await Promise.all([
        api.getDashboard(30),
        api.getSettings()
      ]);
      setCounts({
        critical_risks_count: dashData.critical_risks_count,
        pending_approvals_count: dashData.pending_approvals_count
      });
      setAiEngineStatus(dashData.ai_engine_status);
      setBusinessName(settingsData.business_name);
    } catch (_) {
      // Fallback
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshMeta();
    }
  }, [isAuthenticated, currentTab]);

  const handleSeedData = async () => {
    try {
      setIsSeeding(true);
      const res = await api.seedDemoData();
      addToast(`Dataset reset! Seeded ${res.transactions_seeded} transactions & ${res.expenses_seeded} expenses.`, 'success');
      refreshMeta();
      // Reload current tab data by changing tab or triggering refresh
      const prev = currentTab;
      setCurrentTab('dashboard');
      setTimeout(() => setCurrentTab(prev), 50);
    } catch (err) {
      addToast(err.message || 'Seeding failed', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  if (!isAuthenticated) {
    return <Landing onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <Layout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      counts={counts}
      businessName={businessName}
      aiEngineStatus={aiEngineStatus}
      onSeedData={handleSeedData}
      isSeeding={isSeeding}
    >
      {currentTab === 'dashboard' && <Dashboard onNavigate={setCurrentTab} addToast={addToast} />}
      {currentTab === 'transactions' && <Transactions addToast={addToast} />}
      {currentTab === 'expenses' && <Expenses addToast={addToast} />}
      {currentTab === 'budgets' && <Budgets addToast={addToast} />}
      {currentTab === 'cashflow' && <CashFlow addToast={addToast} />}
      {currentTab === 'risks' && <RiskCenter addToast={addToast} onNavigate={setCurrentTab} />}
      {currentTab === 'insights' && <AIInsights addToast={addToast} onNavigate={setCurrentTab} />}
      {currentTab === 'copilot' && <Copilot addToast={addToast} />}
      {currentTab === 'approvals' && <ApprovalCenter addToast={addToast} />}
      {currentTab === 'audit-logs' && <AuditLogs addToast={addToast} />}
      {currentTab === 'reports' && <Reports addToast={addToast} />}
      {currentTab === 'settings' && <Settings addToast={addToast} onSeedData={handleSeedData} isSeeding={isSeeding} />}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </Layout>
  );
}
