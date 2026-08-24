import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Bot,
  RefreshCw,
  Building2,
  Sliders,
  DollarSign,
  Save,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { LoadingSkeleton } from '../components/common/Feedback';

export function Settings({ addToast, onSeedData, isSeeding }) {
  const [settingsData, setSettingsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [businessName, setBusinessName] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [minReserve, setMinReserve] = useState('500000');
  const [expenseLimit, setExpenseLimit] = useState('1800000');
  const [revenueTarget, setRevenueTarget] = useState('2500000');
  const [riskHigh, setRiskHigh] = useState('60');
  const [riskCritical, setRiskCritical] = useState('80');

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      setSettingsData(res);
      setBusinessName(res.business_name);
      setCurrencySymbol(res.currency_symbol || '₹');
      setMinReserve(res.minimum_cash_reserve.toString());
      setExpenseLimit(res.monthly_expense_limit.toString());
      setRevenueTarget(res.monthly_revenue_target.toString());
      setRiskHigh(res.risk_threshold_high.toString());
      setRiskCritical(res.risk_threshold_critical.toString());
    } catch (err) {
      addToast(err.message || 'Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateSettings({
        business_name: businessName,
        currency_symbol: currencySymbol,
        minimum_cash_reserve: parseFloat(minReserve),
        monthly_expense_limit: parseFloat(expenseLimit),
        monthly_revenue_target: parseFloat(revenueTarget),
        risk_threshold_high: parseInt(riskHigh, 10),
        risk_threshold_critical: parseInt(riskCritical, 10)
      });
      addToast('Settings updated successfully!', 'success');
      loadSettings();
    } catch (err) {
      addToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settingsData) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={3} height="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Controller Settings & Governance</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure operational financial limits, anomaly detection thresholds, and AI engine parameters.
        </p>
      </div>

      {/* AI Engine Status Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <Bot className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">AI Intelligence Engine Mode</h3>
              <p className="text-xs text-slate-500">Active reasoning and multi-agent synthesis provider</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-extrabold rounded-lg border border-indigo-200">
            {settingsData.has_gemini_key ? 'Gemini 1.5 Flash Active' : 'Deterministic AI Mode Active'}
          </span>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
          <p className="leading-relaxed">
            {settingsData.has_gemini_key ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Google Gemini API is configured via environment variables. Natural language reasoning is active.
              </span>
            ) : (
              <span className="text-indigo-900 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Built-in Deterministic AI Engine is active. All financial calculations, risk scores, cash projections, and copilot answers operate deterministically with zero hallucinations.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Building2 className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-900">Business Entity & Financial Bounds</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Business Name</label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-fintech-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Currency Symbol</label>
            <input
              type="text"
              required
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Minimum Cash Reserve Guard (₹)</label>
            <input
              type="number"
              required
              step="1000"
              value={minReserve}
              onChange={(e) => setMinReserve(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Forecast triggers warning when projected liquidity drops below this.</span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Monthly Expense Ceiling (₹)</label>
            <input
              type="number"
              required
              step="1000"
              value={expenseLimit}
              onChange={(e) => setExpenseLimit(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Monthly Revenue Target (₹)</label>
            <input
              type="number"
              required
              step="1000"
              value={revenueTarget}
              onChange={(e) => setRevenueTarget(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Risk Score Threshold (Critical Alert)</label>
            <input
              type="number"
              min="50"
              max="100"
              required
              value={riskCritical}
              onChange={(e) => setRiskCritical(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Transactions above this score require mandatory approval.</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onSeedData}
            loading={isSeeding}
            icon={RefreshCw}
            className="text-xs"
          >
            Reset & Re-seed Demo Data
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={saving}
            icon={Save}
            className="text-xs"
          >
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
}
